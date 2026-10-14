
# Phase 1: Business Understanding
# Objective: Predict startup profit using spending and state.

# Phase 2: Data Understanding

import pandas as pd

df = pd.read_csv("50_Startups.csv")

print("=== Dataset Shape ===")
print(df.shape)

print("\n=== First 5 Rows ===")
print(df.head())

print("\n=== Data Types ===")
print(df.dtypes)

print("\n=== Missing Values ===")
print(df.isnull().sum())

print("\n=== Duplicate Rows ===")
print(df.duplicated().sum())

print("\n=== Descriptive Statistics ===")
print(df.describe())

print("\n=== State Distribution ===")
print(df["State"].value_counts())

print("\n=== Correlation with Profit ===")
print(
    df.select_dtypes(include="number")
      .corr()["Profit"]
      .sort_values(ascending=False)
)

# ==================================================
# Phase 3: Data Preparation
# ==================================================

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
import pandas as pd

# Separate features and target
X = df.drop(columns=["Profit"])
y = df["Profit"]

# Split into 80% training and 20% testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

# One-Hot Encoding for State
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

# Fit only on training data
X_train_encoded = preprocessor.fit_transform(X_train)
X_test_encoded = preprocessor.transform(X_test)

# Retrieve feature names
feature_names = preprocessor.get_feature_names_out()

# Convert to DataFrames
X_train_encoded = pd.DataFrame(
    X_train_encoded,
    columns=feature_names,
    index=X_train.index
)

X_test_encoded = pd.DataFrame(
    X_test_encoded,
    columns=feature_names,
    index=X_test.index
)

print("\n=== Encoded Features ===")
print(feature_names)

print("\n=== Training Shape ===")
print(X_train_encoded.shape)

print("\n=== Testing Shape ===")
print(X_test_encoded.shape)

print("\n=== Encoded Training Data ===")
print(X_train_encoded.head())

print("\n=== Target Shape ===")
print(y_train.shape, y_test.shape)

# ==================================================
# Phase 4A: Baseline Multiple Linear Regression
# ==================================================

from sklearn.linear_model import LinearRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)
import numpy as np
import pandas as pd

# Build baseline model using all 5 features
baseline_model = LinearRegression()

# Train model
baseline_model.fit(X_train_encoded, y_train)

# Predict on test set
y_pred = baseline_model.predict(X_test_encoded)

# Evaluate baseline model
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("\n=== Baseline Model: All 5 Features ===")
print("MAE:", round(mae, 4))
print("RMSE:", round(rmse, 4))
print("R2:", round(r2, 4))

# Show regression coefficients
coefficients = pd.DataFrame({
    "Feature": X_train_encoded.columns,
    "Coefficient": baseline_model.coef_
})

print("\n=== Model Coefficients ===")
print(coefficients)

print("\nIntercept:", baseline_model.intercept_)

# ==================================================
# Phase 4B: Forward Feature Selection
# ==================================================

from sklearn.model_selection import KFold, cross_val_score
from sklearn.linear_model import LinearRegression
import pandas as pd
import numpy as np

features = list(X_train_encoded.columns)

selected_features = []
remaining_features = features.copy()
results = []

cv = KFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

for k in range(1, len(features) + 1):

    best_feature = None
    best_rmse = float("inf")

    # Try adding each remaining feature
    for feature in remaining_features:

        candidate_features = selected_features + [feature]

        model = LinearRegression()

        # 5-fold CV on training data only
        scores = cross_val_score(
            model,
            X_train_encoded[candidate_features],
            y_train,
            cv=cv,
            scoring="neg_mean_squared_error"
        )

        cv_rmse = np.sqrt(-scores.mean())

        if cv_rmse < best_rmse:
            best_rmse = cv_rmse
            best_feature = feature

    # Add best feature
    selected_features.append(best_feature)
    remaining_features.remove(best_feature)

    # Evaluate selected subset with CV
    model = LinearRegression()

    mse_scores = cross_val_score(
        model,
        X_train_encoded[selected_features],
        y_train,
        cv=cv,
        scoring="neg_mean_squared_error"
    )

    r2_scores = cross_val_score(
        model,
        X_train_encoded[selected_features],
        y_train,
        cv=cv,
        scoring="r2"
    )

    results.append({
        "Number of Features": k,
        "Selected Features": selected_features.copy(),
        "CV RMSE": np.sqrt(-mse_scores.mean()),
        "CV R2": r2_scores.mean()
    })

results_df = pd.DataFrame(results)

print("\n=== Forward Feature Selection Results ===")
print(results_df.to_string(index=False))

best_row = results_df.loc[
    results_df["CV RMSE"].idxmin()
]

best_features = best_row["Selected Features"]

print("\n=== Best Feature Subset ===")
print("Number of Features:", len(best_features))
print("Selected Features:", best_features)
print("CV RMSE:", round(best_row["CV RMSE"], 4))
print("CV R2:", round(best_row["CV R2"], 4))

# ==================================================
# Phase 5A: Feature Selection Visualization
# ==================================================

import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 4))

# CV RMSE
axes[0].plot(
    results_df["Number of Features"],
    results_df["CV RMSE"],
    marker="o"
)
axes[0].set_title("CV RMSE vs Number of Features")
axes[0].set_xlabel("Number of Features")
axes[0].set_ylabel("CV RMSE")
axes[0].set_xticks(range(1, 6))
axes[0].grid(True)

# CV R2
axes[1].plot(
    results_df["Number of Features"],
    results_df["CV R2"],
    marker="o"
)
axes[1].set_title("CV R2 vs Number of Features")
axes[1].set_xlabel("Number of Features")
axes[1].set_ylabel("CV R2")
axes[1].set_xticks(range(1, 6))
axes[1].grid(True)

plt.tight_layout()
plt.savefig("feature_selection_comparison.png", dpi=300)
plt.show()

# ==================================================
# Phase 5B: Final Model Evaluation
# ==================================================

final_model = LinearRegression()

final_model.fit(
    X_train_encoded[best_features],
    y_train
)

final_pred = final_model.predict(
    X_test_encoded[best_features]
)

final_mae = mean_absolute_error(y_test, final_pred)
final_rmse = np.sqrt(
    mean_squared_error(y_test, final_pred)
)
final_r2 = r2_score(y_test, final_pred)

comparison = pd.DataFrame({
    "Model": ["Baseline (5 Features)", "Selected Model"],
    "Num Features": [5, len(best_features)],
    "MAE": [mae, final_mae],
    "RMSE": [rmse, final_rmse],
    "R2": [r2, final_r2]
})

print("\n=== Final Model Comparison ===")
print(comparison.to_string(index=False))

print("\n=== Selected Features ===")
print(best_features)

print("\n=== Final Regression Coefficients ===")
for feature, coef in zip(best_features, final_model.coef_):
    print(f"{feature}: {coef:.6f}")

print("Intercept:", final_model.intercept_)

# ============================================================
# Phase 4C: Compare 5 Feature Selection Methods
# Model 0: Baseline OLS
# Model 1: LassoCV
# Model 2: RFECV
# Model 3: Sequential Forward Selection
# Model 4: ElasticNetCV
# Model 5: Exhaustive Feature Selection
# ============================================================

import numpy as np
import pandas as pd

from itertools import combinations

from sklearn.linear_model import (
    LinearRegression,
    LassoCV,
    ElasticNetCV
)
from sklearn.feature_selection import (
    RFECV,
    SequentialFeatureSelector
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import KFold, cross_val_score
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

RANDOM_STATE = 42

CV = KFold(
    n_splits=5,
    shuffle=True,
    random_state=RANDOM_STATE
)

features = list(X_train_encoded.columns)

model_results = []
model_predictions = {}
model_features = {}


# ------------------------------------------------------------
# Helper: Cross-validation RMSE
# ------------------------------------------------------------

def get_cv_rmse(selected):

    scores = cross_val_score(
        LinearRegression(),
        X_train_encoded[selected],
        y_train,
        cv=CV,
        scoring="neg_mean_squared_error"
    )

    return np.sqrt(-scores.mean())


# ------------------------------------------------------------
# Helper: Register and evaluate selected features
# ------------------------------------------------------------

def register(name, selected):

    selected = list(selected)

    model = LinearRegression()

    model.fit(
        X_train_encoded[selected],
        y_train
    )

    pred = model.predict(
        X_test_encoded[selected]
    )

    cv_rmse = get_cv_rmse(selected)

    result = {
        "Model": name,
        "Num Features": len(selected),
        "Selected Features": selected,
        "CV RMSE": cv_rmse,
        "Test MAE": mean_absolute_error(y_test, pred),
        "Test RMSE": np.sqrt(
            mean_squared_error(y_test, pred)
        ),
        "Test R2": r2_score(y_test, pred)
    }

    model_results.append(result)
    model_predictions[name] = pred
    model_features[name] = selected

    print(f"\n{name}")
    print("Selected:", selected)
    print("CV RMSE:", round(cv_rmse, 2))
    print("Test RMSE:", round(result["Test RMSE"], 2))
    print("Test R2:", round(result["Test R2"], 4))


# ------------------------------------------------------------
# Model 0: Baseline OLS
# ------------------------------------------------------------

register("M0 Baseline OLS", features)


# ------------------------------------------------------------
# Model 1: LassoCV Feature Selection
# ------------------------------------------------------------

lasso_pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("lasso", LassoCV(
        cv=CV,
        max_iter=100000,
        random_state=RANDOM_STATE
    ))
])

lasso_pipe.fit(X_train_encoded, y_train)

lasso_coef = lasso_pipe.named_steps["lasso"].coef_

lasso_selected = [
    f for f, c in zip(features, lasso_coef)
    if abs(c) > 1e-6
]

if not lasso_selected:
    lasso_selected = [
        features[np.argmax(np.abs(lasso_coef))]
    ]

register("M1 LassoCV", lasso_selected)


# ------------------------------------------------------------
# Model 2: RFECV
# ------------------------------------------------------------

rfecv = RFECV(
    estimator=LinearRegression(),
    step=1,
    min_features_to_select=1,
    cv=CV,
    scoring="neg_mean_squared_error"
)

rfecv.fit(X_train_encoded, y_train)

rfe_selected = [
    f for f, keep in zip(features, rfecv.support_)
    if keep
]

register("M2 RFECV", rfe_selected)


# ------------------------------------------------------------
# Model 3: Sequential Forward Selection
# ------------------------------------------------------------

# Evaluate subsets of sizes 1 through 4.
# The full 5-feature subset is also considered.

best_sfs_features = features.copy()
best_sfs_rmse = get_cv_rmse(features)

for k in range(1, len(features)):

    sfs = SequentialFeatureSelector(
        LinearRegression(),
        n_features_to_select=k,
        direction="forward",
        scoring="neg_mean_squared_error",
        cv=CV
    )

    sfs.fit(X_train_encoded, y_train)

    selected = [
        f for f, keep in zip(features, sfs.get_support())
        if keep
    ]

    score = get_cv_rmse(selected)

    if score < best_sfs_rmse:
        best_sfs_rmse = score
        best_sfs_features = selected

register("M3 SFS", best_sfs_features)


# ------------------------------------------------------------
# Model 4: ElasticNetCV Feature Selection
# ------------------------------------------------------------

elastic_pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("elastic", ElasticNetCV(
        l1_ratio=[0.1, 0.5, 0.7, 0.9, 0.95, 1.0],
        cv=CV,
        max_iter=100000,
        random_state=RANDOM_STATE
    ))
])

elastic_pipe.fit(X_train_encoded, y_train)

elastic_coef = elastic_pipe.named_steps["elastic"].coef_

elastic_selected = [
    f for f, c in zip(features, elastic_coef)
    if abs(c) > 1e-6
]

if not elastic_selected:
    elastic_selected = [
        features[np.argmax(np.abs(elastic_coef))]
    ]

register("M4 ElasticNetCV", elastic_selected)


# ------------------------------------------------------------
# Model 5: Exhaustive Feature Selection
# ------------------------------------------------------------

best_exhaustive_rmse = float("inf")
best_exhaustive_features = None

for k in range(1, len(features) + 1):

    for subset in combinations(features, k):

        selected = list(subset)
        score = get_cv_rmse(selected)

        if score < best_exhaustive_rmse:
            best_exhaustive_rmse = score
            best_exhaustive_features = selected

register("M5 Exhaustive", best_exhaustive_features)


# ------------------------------------------------------------
# Final Comparison
# ------------------------------------------------------------

comparison_df = pd.DataFrame(model_results)

comparison_df = comparison_df.sort_values(
    by="CV RMSE",
    ascending=True
)

print("\n=== Model 0-5 Comparison ===")

print(
    comparison_df[
        [
            "Model",
            "Num Features",
            "CV RMSE",
            "Test MAE",
            "Test RMSE",
            "Test R2"
        ]
    ].to_string(index=False)
)

print("\n=== Selected Features by Model ===")

for _, row in comparison_df.iterrows():
    print(
        row["Model"],
        "->",
        row["Selected Features"]
    )

comparison_df.to_csv(
    "model_comparison.csv",
    index=False
)

# ============================================================
# Phase 5C: Model Comparison Visualization
# ============================================================

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from pathlib import Path

output_dir = Path("plots")
output_dir.mkdir(exist_ok=True)

# ------------------------------------------------------------
# Plot 1: Feature Selection Comparison
# ------------------------------------------------------------

plot_df = pd.DataFrame(model_results)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

axes[0].bar(
    plot_df["Model"],
    plot_df["Test RMSE"]
)
axes[0].set_title("Test RMSE by Feature Selection Method")
axes[0].set_ylabel("RMSE")
axes[0].tick_params(axis="x", rotation=35)

axes[1].bar(
    plot_df["Model"],
    plot_df["Test R2"]
)
axes[1].set_title("Test R2 by Feature Selection Method")
axes[1].set_ylabel("R2")
axes[1].tick_params(axis="x", rotation=35)

plt.tight_layout()
plt.savefig(
    output_dir / "feature_selection_comparison.png",
    dpi=300
)
plt.close()


# ------------------------------------------------------------
# Plot 2: Actual vs Predicted
# ------------------------------------------------------------

# Sort by actual Profit to make the plot easier to read
sort_idx = np.argsort(y_test.to_numpy())

actual_sorted = y_test.to_numpy()[sort_idx]

plt.figure(figsize=(12, 6))

plt.plot(
    range(len(actual_sorted)),
    actual_sorted,
    "ko-",
    linewidth=2,
    label="Actual Profit"
)

for name, predictions in model_predictions.items():

    pred_sorted = np.asarray(predictions)[sort_idx]

    plt.plot(
        range(len(pred_sorted)),
        pred_sorted,
        marker=".",
        linestyle="--",
        label=name,
        alpha=0.8
    )

plt.title("Actual vs Predicted Profit")
plt.xlabel("Test Samples (Sorted by Actual Profit)")
plt.ylabel("Profit")
plt.legend()
plt.grid(True)
plt.tight_layout()

plt.savefig(
    output_dir / "actual_vs_predicted.png",
    dpi=300
)
plt.close()


# ------------------------------------------------------------
# Plot 3: Top 10 Largest Prediction Errors
# ------------------------------------------------------------

# Use the best model selected by CV RMSE
best_model_name = comparison_df.iloc[0]["Model"]

best_predictions = np.asarray(
    model_predictions[best_model_name]
)

actual = y_test.to_numpy()

absolute_errors = np.abs(actual - best_predictions)

top_indices = np.argsort(absolute_errors)[-10:][::-1]

plt.figure(figsize=(11, 5))

plt.bar(
    range(1, len(top_indices) + 1),
    absolute_errors[top_indices]
)

plt.title(
    f"Top 10 Largest Prediction Errors - {best_model_name}"
)
plt.xlabel("Error Rank")
plt.ylabel("Absolute Error")
plt.xticks(range(1, len(top_indices) + 1))
plt.grid(axis="y")
plt.tight_layout()

plt.savefig(
    output_dir / "top10_outliers_plot.png",
    dpi=300
)
plt.close()

print("\n=== Generated Plots ===")
print("plots/feature_selection_comparison.png")
print("plots/actual_vs_predicted.png")
print("plots/top10_outliers_plot.png")
