# AIOT-DIC2 — Startup Profit Analysis

An interactive machine-learning dashboard for the classic `50_Startups.csv` dataset. The project follows CRISP-DM and compares feature-selection strategies for predicting startup profit from R&D, administration, marketing spend, and state.

## Analysis

- **Dataset:** 50 startup records; target: `Profit`. The Python pipeline uses an 80/20 train/test split (`random_state=42`) and five-fold cross-validation on the training set. State is one-hot encoded with California as the reference category.
- **CRISP-DM:** Business Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, and a local interactive dashboard.
- **Feature selection:** LassoCV, RFECV, Sequential Forward Selection, ElasticNetCV, and Exhaustive Feature Selection.
- **Feature-count experiments:** 25 existing configurations: five methods × k=1–5. Their selected features and evaluation metrics are exported to JSON and CSV.
- **Evaluation:** CV and holdout RMSE, R², and MAE, plus holdout prediction and residual diagnostics. CV metrics guide feature-count selection; the 10-row holdout set is for evaluation.
- **Training OLS statistics:** Training-set OLS with an intercept, produced by `statsmodels`, including R², adjusted R², F-test, coefficient estimates, standard errors, t-tests, p-values, 95% confidence intervals, and VIF. VIF excludes the intercept. Statistical associations do not establish causation.
- **Interactive dashboard:** Overview, dataset explorer, feature-selection charts and statistics, six-model comparison with residual diagnostics, and a live client-side profit predictor using exported OLS coefficients.

## Run locally

Requirements: Python 3.9+ and Node.js 20.9+.

```bash
python3 -m venv .venv
source .venv/bin/activate       # Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
npm ci --prefix dashboard
npm run dev --prefix dashboard
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint --prefix dashboard
(cd dashboard && npx tsc --noEmit)
npm run build --prefix dashboard
```

The dashboard uses the checked-in analysis outputs. To refresh only Training OLS statistics and full-precision prediction coefficients for the existing 25 feature subsets, run from the project root:

```bash
./.venv/bin/python export_dashboard_data.py --refresh-ols-statistics
```

Running `python export_dashboard_data.py` without that option reruns feature-selection analysis. Do so only when intentionally reproducing the experiment results.

## ChatGPT / AI agent assistance

ChatGPT and AI coding agents assisted with implementation, documentation, debugging, and validation. Model metrics and OLS statistics are computed from the supplied dataset by the Python scikit-learn and statsmodels pipeline; generated text or code suggestions should still be reviewed by a human.
