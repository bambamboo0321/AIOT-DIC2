<h1 align="center">AIOT-DIC2 | ML Research Dashboard</h1>

<p align="center">CRISP-DM · Multiple Linear Regression · Feature Selection</p>

<p align="center">
  <a href="https://bambamboo0321.github.io/AIOT-DIC2/"><img src="https://img.shields.io/badge/Live_Demo-Open_Dashboard-00c896?style=for-the-badge" alt="Open the live dashboard"></a>
  <a href="https://github.com/bambamboo0321/AIOT-DIC2"><img src="https://img.shields.io/badge/GitHub-AIOT--DIC2-181717?style=for-the-badge&logo=github" alt="View the GitHub repository"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=flat&logo=scikitlearn&logoColor=white" alt="scikit-learn">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
</p>

## Project Overview

AIOT-DIC2 explores **Profit prediction** with the 50-row `50_Startups.csv` dataset. The Python workflow follows CRISP-DM, compares five feature-selection methods, and evaluates selected feature subsets with OLS multiple linear regression. The interactive dashboard makes the dataset, experiments, model diagnostics, training OLS statistics, and a live coefficient-based predictor easy to inspect.

## Dashboard Features

| Dashboard area | What you can explore |
| --- | --- |
| [Dataset Explorer](https://bambamboo0321.github.io/AIOT-DIC2/dataset/) | Startup records, descriptive statistics, state distribution, and correlations. |
| [Feature Selection Lab](https://bambamboo0321.github.io/AIOT-DIC2/feature-selection/) | Feature-count curves and the selected subset for each method and k. |
| [Model Comparison](https://bambamboo0321.github.io/AIOT-DIC2/comparison/) | RMSE / R² comparisons, holdout metrics, and residual diagnostics. |
| OLS Statistical Analysis | Training-set R², adjusted R², F-test, coefficient tests, confidence intervals, and VIF. |
| [Live Profit Predictor](https://bambamboo0321.github.io/AIOT-DIC2/playground/) | Estimate Profit from spend inputs and State with the selected exported OLS model. |
| Residual Diagnostics | Inspect holdout residuals and rank samples by absolute prediction error. |

## Experiment Design

- **Dataset:** 50 samples; target is `Profit`.
- **Predictors:** Three spend fields plus State, one-hot encoded with California as the reference. This gives five engineered features: `R&D Spend`, `Administration`, `Marketing Spend`, `State_Florida`, and `State_New York`.
- **Split:** 80/20 train-test split with `random_state=42`.
- **Cross-validation:** 5-fold CV on the training set.
- **Feature selection:** LassoCV, RFECV, Sequential Forward Selection, ElasticNetCV, and Exhaustive Feature Selection.
- **Feature counts:** k = 1–5 for each method, for 25 existing experiment configurations.
- **Estimator:** OLS multiple linear regression is fit to each selected subset for the exported model and holdout evaluation.

Cross-validation metrics are calculated on training folds and guide feature-count selection. Holdout metrics are calculated on the separate 10-sample test set for final evaluation; they are not used to choose k. RMSE, R², and MAE are reported for their corresponding evaluation split. Training OLS statistics describe the fit on the 40-row training set and are separate from CV and test metrics. Statistical significance does not establish causation.

## Results

The table compares the full-feature baseline with the existing subset selected by the lowest CV RMSE. The selected subset is chosen using **CV RMSE only**.

| Configuration | Features | CV RMSE |
| --- | --- | ---: |
| Baseline OLS | All 5 engineered features | 9,991.8082 |
| LassoCV, k = 3 — lowest CV RMSE | R&D Spend, Marketing Spend, Administration | **9,583.6789** |

Holdout results for the same configurations are shown separately and are descriptive; they did not select the subset above.

| Configuration | Holdout RMSE | Holdout R² | Holdout MAE |
| --- | ---: | ---: | ---: |
| Baseline OLS | 9,055.9573 | 0.8987 | 6,961.4778 |
| LassoCV, k = 3 | 8,995.9058 | 0.9001 | 6,979.1523 |

The exported experiment results are in [`dashboard/public/data/feature_count_data.json`](dashboard/public/data/feature_count_data.json) and [`dashboard/public/data/dashboard_data.json`](dashboard/public/data/dashboard_data.json).

## Tech Stack

- **ML and analysis:** Python, pandas, NumPy, scikit-learn, statsmodels
- **Dashboard:** Next.js, React, TypeScript, Tailwind CSS, Recharts
- **Deployment:** GitHub Pages with static export

## Getting Started

Requirements: Python 3.9+ and Node.js 20.9+.

### Install Python dependencies

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate       # Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

### Run the Python pipeline

From the repository root:

```bash
python export_dashboard_data.py
```

This runs the feature-selection experiment and exports dashboard data. The existing results are already checked in; running this command intentionally regenerates them.

### Start the dashboard locally

From the repository root:

```bash
npm ci --prefix dashboard
npm run dev --prefix dashboard
```

Open [http://localhost:3000](http://localhost:3000). The deployed dashboard is available at [bambamboo0321.github.io/AIOT-DIC2](https://bambamboo0321.github.io/AIOT-DIC2/).

### Production build

The GitHub Pages workflow builds a static export with Webpack:

```bash
cd dashboard
npm ci
npm run build -- --webpack
```

Useful checks from the repository root:

```bash
npm run lint --prefix dashboard
(cd dashboard && npx tsc --noEmit)
```

To refresh only Training OLS statistics and full-precision prediction coefficients for the existing feature subsets, run from the repository root:

```bash
./.venv/bin/python export_dashboard_data.py --refresh-ols-statistics
```

## CRISP-DM Workflow

| Phase | Project work |
| --- | --- |
| Business Understanding | Frame startup Profit prediction as the analysis objective. |
| Data Understanding | Explore the 50 records, distributions, missingness, and correlations. |
| Data Preparation | Prepare the train/test split and encode State with a reference category. |
| Modeling | Compare five feature-selection methods and OLS models across k = 1–5. |
| Evaluation | Compare training-fold CV metrics and the separate holdout metrics; inspect residuals and OLS statistics. |
| Deployment | Publish the interactive research dashboard as a static GitHub Pages site. |

## AI Assistance Disclosure

ChatGPT and AI agents assisted with programming, debugging, validation, dashboard development, and documentation. The project’s reported metrics and OLS statistics come from the Python pipeline and checked-in dataset; AI assistance does not replace review of the implementation or interpretation of results.
