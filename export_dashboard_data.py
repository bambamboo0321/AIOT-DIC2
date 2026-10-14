import json
import argparse
from itertools import combinations
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_selection import RFECV, SequentialFeatureSelector
from sklearn.linear_model import ElasticNetCV, LassoCV, LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor


def refresh_existing_ols_statistics():
    """Enrich the existing dashboard payload without rerunning feature selection."""
    dashboard_path = Path("dashboard/src/data/dashboard_data.json")
    payload = json.loads(dashboard_path.read_text())
    df = pd.read_csv("50_Startups.csv")
    X = df.drop(columns=["Profit"])
    y = df["Profit"]
    X_train, _, y_train, _ = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )
    preprocessor = ColumnTransformer(
        transformers=[
            ("state", OneHotEncoder(drop="first", handle_unknown="ignore", sparse_output=False), ["State"])
        ],
        remainder="passthrough",
        verbose_feature_names_out=False
    )
    encoded = preprocessor.fit_transform(X_train)
    all_features = list(preprocessor.get_feature_names_out())
    X_train_df = pd.DataFrame(encoded, columns=all_features, index=X_train.index)

    for entry in payload["feature_count_curves"]:
        features = entry["features"]
        selected = X_train_df[features]
        fit = sm.OLS(y_train, sm.add_constant(selected, has_constant="add")).fit()
        entry["intercept"] = float(fit.params["const"])
        entry["coefficients"] = {feature: float(fit.params[feature]) for feature in features}
        intercept_ci = fit.conf_int().loc["const"]
        coefficient_stats = [{
            "feature": "Intercept",
            "estimate": float(fit.params["const"]),
            "std_error": float(fit.bse["const"]),
            "t_statistic": float(fit.tvalues["const"]),
            "p_value": float(fit.pvalues["const"]),
            "ci_lower": float(intercept_ci.iloc[0]),
            "ci_upper": float(intercept_ci.iloc[1]),
            "vif": None,
            "vif_note": "VIF is not computed for the intercept."
        }]
        for feature in features:
            vif_value = None
            vif_note = None
            try:
                # VIF excludes the intercept; calculate it over the selected regressors only.
                vif_value = float(variance_inflation_factor(selected.to_numpy(dtype=float), features.index(feature)))
                if not np.isfinite(vif_value):
                    vif_value = None
                    vif_note = "Not estimable for this feature subset."
            except (ValueError, np.linalg.LinAlgError, ZeroDivisionError):
                vif_note = "Not estimable for this feature subset."
            ci = fit.conf_int().loc[feature]
            coefficient_stats.append({
                "feature": feature,
                "estimate": float(fit.params[feature]),
                "std_error": float(fit.bse[feature]),
                "t_statistic": float(fit.tvalues[feature]),
                "p_value": float(fit.pvalues[feature]),
                "ci_lower": float(ci.iloc[0]),
                "ci_upper": float(ci.iloc[1]),
                "vif": vif_value,
                "vif_note": vif_note
            })
        entry["training_ols_statistics"] = {
            "r_squared": float(fit.rsquared),
            "adjusted_r_squared": float(fit.rsquared_adj),
            "f_statistic": float(fit.fvalue) if np.isfinite(fit.fvalue) else None,
            "f_p_value": float(fit.f_pvalue) if np.isfinite(fit.f_pvalue) else None,
            "observations": int(fit.nobs),
            "coefficients": coefficient_stats
        }

    # Keep legacy model details at the same full precision without changing evaluated metrics.
    for model in payload["models"]:
        if model["id"] == "M0":
            curve = next((item for item in payload["feature_count_curves"] if item["k"] == 5 and set(item["features"]) == set(model["features"])), None)
            if curve:
                model["intercept"] = curve["intercept"]
                model["coefficients"] = curve["coefficients"]

    for target in [dashboard_path, Path("dashboard/public/data/dashboard_data.json"), Path("dashboard_data.json")]:
        target.write_text(json.dumps(payload, indent=2) + "\n")
    Path("dashboard/public/data/feature_count_data.json").write_text(
        json.dumps(payload["feature_count_curves"], indent=2) + "\n"
    )
    print(f"Updated Training OLS Statistics for {len(payload['feature_count_curves'])} existing feature subsets.")

RANDOM_STATE = 42

def main():
    print("Reading 50_Startups.csv...")
    df = pd.read_csv("50_Startups.csv")

    # 1. Dataset Understanding & Metadata
    total_samples = len(df)
    columns_info = [
        {"name": col, "type": str(df[col].dtype), "missing": int(df[col].isnull().sum())}
        for col in df.columns
    ]
    
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    descriptive_stats = df.describe().to_dict()
    
    # Clean up stats dict for json serialization
    stats_formatted = {}
    for col, stat_values in descriptive_stats.items():
        stats_formatted[col] = {k: round(float(v), 4) for k, v in stat_values.items()}

    # State distribution
    state_counts = df["State"].value_counts().to_dict()
    state_distribution = [
        {"state": k, "count": int(v), "percentage": round(float(v) / total_samples * 100, 2)}
        for k, v in state_counts.items()
    ]

    # Correlation matrix
    corr_matrix = df.select_dtypes(include="number").corr()
    correlation_data = {
        "columns": corr_matrix.columns.tolist(),
        "matrix": [[round(float(val), 4) for val in row] for row in corr_matrix.values],
        "with_profit": {col: round(float(corr_matrix.loc[col, "Profit"]), 4) for col in corr_matrix.columns}
    }

    # All dataset records for table view
    raw_records = [
        {
            "id": int(i),
            "rd_spend": round(float(row["R&D Spend"]), 2),
            "administration": round(float(row["Administration"]), 2),
            "marketing_spend": round(float(row["Marketing Spend"]), 2),
            "state": str(row["State"]),
            "profit": round(float(row["Profit"]), 2)
        }
        for i, row in df.iterrows()
    ]

    # 2. Data Preparation
    X = df.drop(columns=["Profit"])
    y = df["Profit"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=RANDOM_STATE
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "state",
                OneHotEncoder(
                    drop="first",
                    handle_unknown="ignore",
                    sparse_output=False
                ),
                ["State"]
            )
        ],
        remainder="passthrough",
        verbose_feature_names_out=False
    )

    X_train_encoded = preprocessor.fit_transform(X_train)
    X_test_encoded = preprocessor.transform(X_test)
    feature_names = list(preprocessor.get_feature_names_out())

    X_train_df = pd.DataFrame(X_train_encoded, columns=feature_names, index=X_train.index)
    X_test_df = pd.DataFrame(X_test_encoded, columns=feature_names, index=X_test.index)

    CV = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    def get_cv_rmse(features_list):
        scores = cross_val_score(
            LinearRegression(),
            X_train_df[features_list],
            y_train,
            cv=CV,
            scoring="neg_mean_squared_error"
        )
        return float(np.sqrt(-scores.mean()))

    # 3. Step-by-Step Forward Selection Progression
    forward_progression = []
    sel_f = []
    rem_f = feature_names.copy()
    for step in range(1, len(feature_names) + 1):
        best_f = None
        best_rmse = float("inf")
        for f in rem_f:
            cand = sel_f + [f]
            score = get_cv_rmse(cand)
            if score < best_rmse:
                best_rmse = score
                best_f = f
        sel_f.append(best_f)
        rem_f.remove(best_f)

        r2_sc = cross_val_score(
            LinearRegression(),
            X_train_df[sel_f],
            y_train,
            cv=CV,
            scoring="r2"
        ).mean()

        forward_progression.append({
            "step": step,
            "feature_added": best_f,
            "selected_features": sel_f.copy(),
            "num_features": len(sel_f),
            "cv_rmse": round(best_rmse, 4),
            "cv_r2": round(float(r2_sc), 4)
        })

    # 4. Feature Selection Methods Execution
    # Model 0: Baseline OLS
    m0_features = feature_names.copy()

    # Model 1: LassoCV
    lasso_pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("lasso", LassoCV(cv=CV, max_iter=100000, random_state=RANDOM_STATE))
    ])
    lasso_pipe.fit(X_train_df, y_train)
    lasso_coef = lasso_pipe.named_steps["lasso"].coef_
    m1_features = [f for f, c in zip(feature_names, lasso_coef) if abs(c) > 1e-6]

    # Model 2: RFECV (Standard unscaled implementation from 50_startups_crispdm.py)
    rfecv = RFECV(
        estimator=LinearRegression(),
        step=1,
        min_features_to_select=1,
        cv=CV,
        scoring="neg_mean_squared_error"
    )
    rfecv.fit(X_train_df, y_train)
    m2_features = [f for f, keep in zip(feature_names, rfecv.support_) if keep]

    # Model 3: SFS
    best_sfs_features = feature_names.copy()
    best_sfs_rmse = get_cv_rmse(feature_names)
    for k in range(1, len(feature_names)):
        sfs = SequentialFeatureSelector(
            LinearRegression(),
            n_features_to_select=k,
            direction="forward",
            scoring="neg_mean_squared_error",
            cv=CV
        )
        sfs.fit(X_train_df, y_train)
        cand = [f for f, keep in zip(feature_names, sfs.get_support()) if keep]
        score = get_cv_rmse(cand)
        if score < best_sfs_rmse:
            best_sfs_rmse = score
            best_sfs_features = cand
    m3_features = best_sfs_features

    # Model 4: ElasticNetCV
    elastic_pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("elastic", ElasticNetCV(
            l1_ratio=[0.1, 0.5, 0.7, 0.9, 0.95, 1.0],
            cv=CV,
            max_iter=100000,
            random_state=RANDOM_STATE
        ))
    ])
    elastic_pipe.fit(X_train_df, y_train)
    elastic_coef = elastic_pipe.named_steps["elastic"].coef_
    m4_features = [f for f, c in zip(feature_names, elastic_coef) if abs(c) > 1e-6]

    # Model 5: Exhaustive Feature Selection
    best_ex_rmse = float("inf")
    best_ex_features = None
    all_exhaustive_subsets = []
    for k in range(1, len(feature_names) + 1):
        for subset in combinations(feature_names, k):
            sub_list = list(subset)
            score = get_cv_rmse(sub_list)
            all_exhaustive_subsets.append({
                "features": sub_list,
                "num_features": k,
                "cv_rmse": round(score, 4)
            })
            if score < best_ex_rmse:
                best_ex_rmse = score
                best_ex_features = sub_list
    m5_features = best_ex_features

    # Sort exhaustive subsets by CV RMSE
    all_exhaustive_subsets.sort(key=lambda x: x["cv_rmse"])

    models_meta = [
        {
            "id": "M0",
            "name": "Baseline OLS",
            "category": "Baseline",
            "method": "Ordinary Least Squares (All Features)",
            "description": "Standard multiple linear regression fitted on all 5 available features without variable elimination.",
            "features": m0_features
        },
        {
            "id": "M1",
            "name": "LassoCV",
            "category": "Embedded",
            "method": "L1 Regularization with 5-Fold CV",
            "description": "Applies an L1 penalty on standardized features to shrink non-essential regression coefficients strictly to zero.",
            "features": m1_features
        },
        {
            "id": "M2",
            "name": "RFECV",
            "category": "Wrapper",
            "method": "Recursive Feature Elimination with 5-Fold CV",
            "description": "Iteratively trains estimators and prunes the least contributing feature based on coefficient weights.",
            "features": m2_features,
            "note": "RFECV retained all five encoded features in this run; this observation alone does not establish why the selection occurred."
        },
        {
            "id": "M3",
            "name": "Sequential Forward Selection",
            "category": "Wrapper",
            "method": "Greedy Forward Selection (SFS)",
            "description": "Starts with an empty feature set and greedily adds the feature that yields the maximum CV RMSE reduction at each step.",
            "features": m3_features
        },
        {
            "id": "M4",
            "name": "ElasticNetCV",
            "category": "Embedded",
            "method": "L1 + L2 Regularization with 5-Fold CV",
            "description": "Combines L1 sparsity with L2 shrinkage across multiple l1_ratio hyperparameter candidates.",
            "features": m4_features
        },
        {
            "id": "M5",
            "name": "Exhaustive Feature Selection",
            "category": "Global Search",
            "method": "Brute-force Combinatorial Search (2^5 - 1 = 31 subsets)",
            "description": "Evaluates all 31 non-empty feature combinations via 5-fold CV to mathematically guarantee the global minimum CV error.",
            "features": m5_features
        }
    ]

    # Evaluate each model using OLS on selected features
    model_evaluations = []
    test_actuals = y_test.values.tolist()
    test_indices = y_test.index.tolist()

    for meta in models_meta:
        feats = meta["features"]
        cv_rmse = get_cv_rmse(feats)

        lr = LinearRegression()
        lr.fit(X_train_df[feats], y_train)
        pred = lr.predict(X_test_df[feats])

        mae = float(mean_absolute_error(y_test, pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, pred)))
        r2 = float(r2_score(y_test, pred))

        coefs = {feat: round(float(coef), 6) for feat, coef in zip(feats, lr.coef_)}
        intercept = round(float(lr.intercept_), 4)

        predictions_detail = []
        for idx, actual_val, pred_val in zip(test_indices, test_actuals, pred):
            err = float(actual_val - pred_val)
            abs_err = abs(err)
            pct_err = float(abs_err / actual_val * 100) if actual_val != 0 else 0.0
            predictions_detail.append({
                "sample_id": int(idx),
                "actual": round(float(actual_val), 2),
                "predicted": round(float(pred_val), 2),
                "residual": round(err, 2),
                "abs_error": round(abs_err, 2),
                "pct_error": round(pct_err, 2)
            })

        # Sort test samples by actual value for consistent charting
        predictions_sorted = sorted(predictions_detail, key=lambda x: x["actual"])

        model_evaluations.append({
            "id": meta["id"],
            "name": meta["name"],
            "category": meta["category"],
            "method": meta["method"],
            "description": meta["description"],
            "features": feats,
            "num_features": len(feats),
            "cv_rmse": round(cv_rmse, 4),
            "test_mae": round(mae, 4),
            "test_rmse": round(rmse, 4),
            "test_r2": round(r2, 6),
            "coefficients": coefs,
            "intercept": intercept,
            "predictions": predictions_sorted,
            "note": meta.get("note", None)
        })

    # Determine best model based strictly on Training CV RMSE (as per user requirements)
    best_model = min(model_evaluations, key=lambda m: m["cv_rmse"])

    # CRISP-DM Workflow Stages
    crispdm_phases = [
        {
            "id": "phase-1",
            "number": 1,
            "name": "Business Understanding",
            "status": "COMPLETED",
            "summary": "Identify key profitability drivers for 50 startups to optimize investment allocation and venture capital evaluation.",
            "metrics": {"Goal": "Predict Profit", "Target Variable": "Profit", "Use Case": "Venture Capital Due Diligence"}
        },
        {
            "id": "phase-2",
            "number": 2,
            "name": "Data Understanding",
            "status": "COMPLETED",
            "summary": "Exploratory analysis on 50 startup records across 3 spending categories and 3 US states. No missing values or duplicates found.",
            "metrics": {"Total Rows": 50, "Missing Values": 0, "Top Correlated Feature": "R&D Spend (r=0.9729)"}
        },
        {
            "id": "phase-3",
            "number": 3,
            "name": "Data Preparation",
            "status": "COMPLETED",
            "summary": "Train/Test split (80/20, random_state=42). Dummy encoding on State column using drop='first' to avoid dummy variable trap.",
            "metrics": {"Train Samples": len(X_train), "Test Samples": len(X_test), "Encoded Features": 5}
        },
        {
            "id": "phase-4",
            "number": 4,
            "name": "Modeling",
            "status": "COMPLETED",
            "summary": "Trained baseline OLS and 5 distinct feature selection methods (LassoCV, RFECV, SFS, ElasticNetCV, Exhaustive).",
            "metrics": {"Models Evaluated": 6, "Methods Tested": 5, "Best Feature Count": 3}
        },
        {
            "id": "phase-5",
            "number": 5,
            "name": "Evaluation",
            "status": "COMPLETED",
            "summary": "Assessed models on 5-fold CV RMSE and out-of-sample Test RMSE/R2. 4 methods converged on identical 3-feature subset.",
            "metrics": {"Best CV RMSE": round(best_model["cv_rmse"], 2), "Test R²": round(best_model["test_r2"], 4), "Optimal Subset": "['R&D Spend', 'Administration', 'Marketing Spend']"}
        },
        {
            "id": "phase-6",
            "number": 6,
            "name": "Deployment",
            "status": "IN_PROGRESS",
            "summary": "Interactive Geek / AI Research Lab Dashboard MVP for exploring models, feature selections, and prediction diagnostics.",
            "metrics": {"Artifact": "Next.js Lab Dashboard", "State": "Local MVP Operational"}
        }
    ]

    export_payload = {
        "metadata": {
            "project": "AIOT-DIC2",
            "title": "50 Startups Profit Prediction Dashboard",
            "generated_at": pd.Timestamp.now().isoformat(),
            "random_state": RANDOM_STATE,
            "best_cv_model_id": best_model["id"],
            "best_cv_model_name": best_model["name"]
        },
        "dataset_summary": {
            "total_samples": total_samples,
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "target": "Profit",
            "original_features": ["R&D Spend", "Administration", "Marketing Spend", "State"],
            "encoded_features": feature_names,
            "columns": columns_info,
            "statistics": stats_formatted,
            "state_distribution": state_distribution,
            "correlation": correlation_data,
            "records": raw_records
        },
        "crispdm": crispdm_phases,
        "models": model_evaluations,
        "forward_progression": forward_progression,
        "exhaustive_subsets": all_exhaustive_subsets[:10], # Top 10 combinations
        "test_ground_truth": [
            {"sample_id": int(i), "actual": round(float(val), 2)}
            for i, val in zip(test_indices, test_actuals)
        ]
    }

    # Save to local directory
    out_file = Path("dashboard_data.json")
    with open(out_file, "w") as f:
        json.dump(export_payload, f, indent=2)
    print(f"Exported data to {out_file.resolve()} ({len(json.dumps(export_payload))} bytes)")

    return export_payload

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh-ols-statistics", action="store_true", help="Recompute OLS details for existing feature subsets without rerunning selection.")
    args = parser.parse_args()
    if args.refresh_ols_statistics:
        refresh_existing_ols_statistics()
    else:
        main()
