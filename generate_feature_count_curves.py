import json
from itertools import combinations
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_selection import RFE, SequentialFeatureSelector
from sklearn.linear_model import ElasticNetCV, LassoCV, LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RANDOM_STATE = 42

def main():
    print("=== Step 1: Loading Data and Preparing Partitions ===")
    df = pd.read_csv("50_Startups.csv")
    X = df.drop(columns=["Profit"])
    y = df["Profit"]

    # 80/20 train/test split, random_state=42
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=RANDOM_STATE
    )

    # One-Hot Encoding for State (drop='first' to prevent dummy variable trap)
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

    X_train_enc = pd.DataFrame(
        preprocessor.fit_transform(X_train),
        columns=preprocessor.get_feature_names_out(),
        index=X_train.index
    )

    X_test_enc = pd.DataFrame(
        preprocessor.transform(X_test),
        columns=preprocessor.get_feature_names_out(),
        index=X_test.index
    )

    features = list(X_train_enc.columns)
    CV = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

    def evaluate_subset(feats):
        feats = list(feats)
        lr = LinearRegression()
        
        # 5-fold CV on Training Set
        mse_scores = cross_val_score(
            lr,
            X_train_enc[feats],
            y_train,
            cv=CV,
            scoring="neg_mean_squared_error"
        )
        r2_scores = cross_val_score(
            lr,
            X_train_enc[feats],
            y_train,
            cv=CV,
            scoring="r2"
        )
        cv_rmse = float(np.sqrt(-mse_scores.mean()))
        cv_r2 = float(r2_scores.mean())

        # Final evaluation on holdout Test Set
        lr.fit(X_train_enc[feats], y_train)
        pred = lr.predict(X_test_enc[feats])
        test_mae = float(mean_absolute_error(y_test, pred))
        test_rmse = float(np.sqrt(mean_squared_error(y_test, pred)))
        test_r2 = float(r2_score(y_test, pred))

        return {
            "cv_rmse": cv_rmse,
            "cv_r2": cv_r2,
            "test_mae": test_mae,
            "test_rmse": test_rmse,
            "test_r2": test_r2,
            "coefs": {f: round(float(c), 6) for f, c in zip(feats, lr.coef_)},
            "intercept": round(float(lr.intercept_), 4)
        }

    print("=== Step 2: Running 5 Feature Selection Algorithms across k=1..5 ===")
    
    # 1. LassoCV (Standardized coefficients absolute ranking)
    lasso_pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("lasso", LassoCV(cv=CV, max_iter=100000, random_state=RANDOM_STATE))
    ])
    lasso_pipe.fit(X_train_enc, y_train)
    lasso_coef_abs = np.abs(lasso_pipe.named_steps["lasso"].coef_)
    lasso_ranking = [f for _, f in sorted(zip(lasso_coef_abs, features), reverse=True)]
    print(f"LassoCV ranking: {lasso_ranking}")

    # 2. ElasticNetCV (Standardized coefficients absolute ranking)
    elastic_pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("elastic", ElasticNetCV(
            l1_ratio=[0.1, 0.5, 0.7, 0.9, 0.95, 1.0],
            cv=CV,
            max_iter=100000,
            random_state=RANDOM_STATE
        ))
    ])
    elastic_pipe.fit(X_train_enc, y_train)
    elastic_coef_abs = np.abs(elastic_pipe.named_steps["elastic"].coef_)
    elastic_ranking = [f for _, f in sorted(zip(elastic_coef_abs, features), reverse=True)]
    print(f"ElasticNetCV ranking: {elastic_ranking}")

    # 3. RFECV / RFE Ranking
    # Using standardized recursive feature elimination so pruning order reflects standardized effect sizes
    scaler = StandardScaler()
    X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train_enc), columns=features)
    rfe = RFE(estimator=LinearRegression(), n_features_to_select=1, step=1)
    rfe.fit(X_train_scaled, y_train)
    rfe_ranking = [f for _, f in sorted(zip(rfe.ranking_, features))]
    print(f"RFECV (RFE Standardized) ranking: {rfe_ranking}")

    # Also compute unscaled RFE for comparative analysis
    rfe_unscaled = RFE(estimator=LinearRegression(), n_features_to_select=1, step=1)
    rfe_unscaled.fit(X_train_enc, y_train)
    rfe_unscaled_ranking = [f for _, f in sorted(zip(rfe_unscaled.ranking_, features))]
    print(f"RFE (Unscaled) ranking: {rfe_unscaled_ranking}")

    # 4. Sequential Forward Selection (SFS)
    sfs_subsets = {}
    for k in range(1, 6):
        if k == 5:
            sfs_subsets[k] = features
        else:
            sfs = SequentialFeatureSelector(
                LinearRegression(),
                n_features_to_select=k,
                direction="forward",
                scoring="neg_mean_squared_error",
                cv=CV
            )
            sfs.fit(X_train_enc, y_train)
            sfs_subsets[k] = [f for f, keep in zip(features, sfs.get_support()) if keep]
    print(f"SFS subsets: {sfs_subsets}")

    # 5. Exhaustive Feature Selection
    exhaustive_subsets = {}
    for k in range(1, 6):
        best_comb = None
        best_rmse = float("inf")
        for comb in combinations(features, k):
            cand = list(comb)
            res = evaluate_subset(cand)
            if res["cv_rmse"] < best_rmse:
                best_rmse = res["cv_rmse"]
                best_comb = cand
        exhaustive_subsets[k] = best_comb
    print(f"Exhaustive subsets: {exhaustive_subsets}")

    # Assemble all 25 experiments
    algorithms = [
        ("LassoCV", {k: lasso_ranking[:k] for k in range(1, 6)}),
        ("RFECV", {k: rfe_ranking[:k] for k in range(1, 6)}),
        ("Sequential Forward Selection", sfs_subsets),
        ("ElasticNetCV", {k: elastic_ranking[:k] for k in range(1, 6)}),
        ("Exhaustive Feature Selection", exhaustive_subsets)
    ]

    records = []
    dashboard_curves = []

    for algo_name, subset_dict in algorithms:
        for k in range(1, 6):
            sel_feats = subset_dict[k]
            metrics = evaluate_subset(sel_feats)

            records.append({
                "Algorithm": algo_name,
                "k": k,
                "Selected Features": str(sel_feats),
                "CV RMSE": metrics["cv_rmse"],
                "CV R2": metrics["cv_r2"],
                "Test MAE": metrics["test_mae"],
                "Test RMSE": metrics["test_rmse"],
                "Test R2": metrics["test_r2"]
            })

            dashboard_curves.append({
                "algorithm": algo_name,
                "k": k,
                "features": sel_feats,
                "num_features": k,
                "cv_rmse": round(metrics["cv_rmse"], 4),
                "cv_r2": round(metrics["cv_r2"], 4),
                "test_mae": round(metrics["test_mae"], 4),
                "test_rmse": round(metrics["test_rmse"], 4),
                "test_r2": round(metrics["test_r2"], 4),
                "coefficients": metrics["coefs"],
                "intercept": metrics["intercept"]
            })

    comparison_df = pd.DataFrame(records)

    # Save feature_count_comparison.csv (25 rows)
    out_csv = "feature_count_comparison.csv"
    comparison_df.to_csv(out_csv, index=False)
    print(f"Exported {out_csv} ({len(comparison_df)} rows)")

    # Validation checks
    assert len(comparison_df) == 25, f"Expected 25 rows, got {len(comparison_df)}"
    for algo_name in comparison_df["Algorithm"].unique():
        k5_row = comparison_df[(comparison_df["Algorithm"] == algo_name) & (comparison_df["k"] == 5)].iloc[0]
        feats_k5 = eval(k5_row["Selected Features"])
        assert len(feats_k5) == 5, f"{algo_name} at k=5 does not have 5 features"
        assert set(feats_k5) == set(features), f"{algo_name} at k=5 does not match full feature set"
    print("All validation checks passed!")

    # Step 3: Generate Visualizations
    print("=== Step 3: Generating Performance Curve Plots ===")
    
    # Palette definition for clean, professional research charts
    colors = {
        "LassoCV": "#0284c7",                     # Sky blue
        "RFECV": "#7c3aed",                       # Violet
        "Sequential Forward Selection": "#059669", # Emerald green
        "ElasticNetCV": "#db2777",                # Rose / Magenta
        "Exhaustive Feature Selection": "#ea580c" # Amber / Orange
    }
    markers = {
        "LassoCV": "o",
        "RFECV": "s",
        "Sequential Forward Selection": "^",
        "ElasticNetCV": "D",
        "Exhaustive Feature Selection": "v"
    }
    linestyles = {
        "LassoCV": "-",
        "RFECV": "--",
        "Sequential Forward Selection": "-.",
        "ElasticNetCV": ":",
        "Exhaustive Feature Selection": "-"
    }

    # Plot 1: RMSE vs Feature Count (CV RMSE & Test RMSE)
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5), sharey=False)

    for algo_name in comparison_df["Algorithm"].unique():
        sub = comparison_df[comparison_df["Algorithm"] == algo_name]
        # CV RMSE
        axes[0].plot(
            sub["k"],
            sub["CV RMSE"],
            marker=markers[algo_name],
            color=colors[algo_name],
            linestyle=linestyles[algo_name],
            linewidth=2,
            markersize=7,
            label=algo_name
        )
        # Test RMSE
        axes[1].plot(
            sub["k"],
            sub["Test RMSE"],
            marker=markers[algo_name],
            color=colors[algo_name],
            linestyle=linestyles[algo_name],
            linewidth=2,
            markersize=7,
            label=algo_name
        )

    # Subplot 0: 5-Fold CV RMSE
    axes[0].set_title("Training 5-Fold CV RMSE vs. Feature Count (k)", fontsize=12, fontweight="bold")
    axes[0].set_xlabel("Number of Features (k)", fontsize=11)
    axes[0].set_ylabel("Cross-Validation RMSE ($)", fontsize=11)
    axes[0].set_xticks(range(1, 6))
    axes[0].grid(True, linestyle="--", alpha=0.5)
    axes[0].axvline(x=3, color="red", linestyle=":", alpha=0.7, label="Optimal Subset (k=3)")
    axes[0].legend(loc="upper right", fontsize=8.5, framealpha=0.9)

    # Subplot 1: Holdout Test RMSE
    axes[1].set_title("Holdout Test Set RMSE vs. Feature Count (k)", fontsize=12, fontweight="bold")
    axes[1].set_xlabel("Number of Features (k)", fontsize=11)
    axes[1].set_ylabel("Test Set RMSE ($)", fontsize=11)
    axes[1].set_xticks(range(1, 6))
    axes[1].grid(True, linestyle="--", alpha=0.5)
    axes[1].legend(loc="lower right", fontsize=8.5, framealpha=0.9)

    plt.suptitle("Multiple Linear Regression: RMSE Performance across 5 Feature Selection Methods", fontsize=13, y=1.02)
    plt.tight_layout()
    plt.savefig("rmse_vs_feature_count.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Saved rmse_vs_feature_count.png")

    # Plot 2: R2 vs Feature Count (CV R2 & Test R2)
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5), sharey=False)

    for algo_name in comparison_df["Algorithm"].unique():
        sub = comparison_df[comparison_df["Algorithm"] == algo_name]
        # CV R2
        axes[0].plot(
            sub["k"],
            sub["CV R2"],
            marker=markers[algo_name],
            color=colors[algo_name],
            linestyle=linestyles[algo_name],
            linewidth=2,
            markersize=7,
            label=algo_name
        )
        # Test R2
        axes[1].plot(
            sub["k"],
            sub["Test R2"],
            marker=markers[algo_name],
            color=colors[algo_name],
            linestyle=linestyles[algo_name],
            linewidth=2,
            markersize=7,
            label=algo_name
        )

    # Subplot 0: 5-Fold CV R2
    axes[0].set_title("Training 5-Fold CV R² vs. Feature Count (k)", fontsize=12, fontweight="bold")
    axes[0].set_xlabel("Number of Features (k)", fontsize=11)
    axes[0].set_ylabel("Cross-Validation R² Score", fontsize=11)
    axes[0].set_xticks(range(1, 6))
    axes[0].grid(True, linestyle="--", alpha=0.5)
    axes[0].axvline(x=3, color="red", linestyle=":", alpha=0.7, label="Optimal Subset (k=3)")
    axes[0].legend(loc="lower right", fontsize=8.5, framealpha=0.9)

    # Subplot 1: Holdout Test R2
    axes[1].set_title("Holdout Test Set R² vs. Feature Count (k)", fontsize=12, fontweight="bold")
    axes[1].set_xlabel("Number of Features (k)", fontsize=11)
    axes[1].set_ylabel("Test Set R² Score", fontsize=11)
    axes[1].set_xticks(range(1, 6))
    axes[1].grid(True, linestyle="--", alpha=0.5)
    axes[1].legend(loc="lower left", fontsize=8.5, framealpha=0.9)

    plt.suptitle("Multiple Linear Regression: R² Performance across 5 Feature Selection Methods", fontsize=13, y=1.02)
    plt.tight_layout()
    plt.savefig("r2_vs_feature_count.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Saved r2_vs_feature_count.png")

    # Step 4: Export JSON for Next.js Dashboard
    print("=== Step 4: Updating Dashboard JSON Data ===")
    feature_count_json_path = Path("dashboard/public/data/feature_count_data.json")
    with open(feature_count_json_path, "w") as f:
        json.dump(dashboard_curves, f, indent=2)

    # Also update main dashboard_data.json
    main_json_path = Path("dashboard/src/data/dashboard_data.json")
    if main_json_path.exists():
        with open(main_json_path, "r") as f:
            full_data = json.load(f)
        full_data["feature_count_curves"] = dashboard_curves
        with open(main_json_path, "w") as f:
            json.dump(full_data, f, indent=2)
        # Keep public in sync
        with open(Path("dashboard/public/data/dashboard_data.json"), "w") as f:
            json.dump(full_data, f, indent=2)
        print("Updated dashboard_data.json with feature_count_curves")

    print("Experiment execution completed successfully!")

if __name__ == "__main__":
    main()
