"use client";

import { useState } from "react";
import { getDashboardData } from "@/lib/data";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { CheckCircle2, Sliders, ChevronDown } from "lucide-react";

export default function FeatureSelectionLabPage() {
  const data = getDashboardData();
  const curves = data.feature_count_curves || [];

  // 1. The Three Mandatory Dropdowns
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("LassoCV");
  const [selectedK, setSelectedK] = useState<number>(3);
  const [selectedMetric, setSelectedMetric] = useState<"cv_rmse" | "test_rmse" | "cv_r2" | "test_r2">("cv_rmse");

  // Chart-specific view toggles (CV vs Test)
  const [rmseChartView, setRmseChartView] = useState<"cv" | "test">("cv");
  const [r2ChartView, setR2ChartView] = useState<"cv" | "test">("cv");

  // Legend visibility toggles
  const [hiddenAlgorithms, setHiddenAlgorithms] = useState<Record<string, boolean>>({});

  const algorithmOptions = [
    { value: "LassoCV", label: "LassoCV (L1 Regularization)" },
    { value: "RFECV", label: "RFECV (Recursive Feature Elimination)" },
    { value: "Sequential Forward Selection", label: "SFS (Sequential Forward Selection)" },
    { value: "ElasticNetCV", label: "ElasticNetCV (L1 + L2 Hybrid)" },
    { value: "Exhaustive Feature Selection", label: "Exhaustive (All Combinations Search)" }
  ];

  const featureCountOptions = [
    { value: 1, label: "k = 1 Feature" },
    { value: 2, label: "k = 2 Features" },
    { value: 3, label: "k = 3 Features (Best CV RMSE)" },
    { value: 4, label: "k = 4 Features" },
    { value: 5, label: "k = 5 Features (Full Set)" }
  ];

  const metricOptions = [
    { value: "cv_rmse", label: "Selection CV RMSE (Train 5-Fold)", unit: "$" },
    { value: "test_rmse", label: "Holdout Test RMSE", unit: "$" },
    { value: "cv_r2", label: "Selection CV R² (Train 5-Fold)", unit: "" },
    { value: "test_r2", label: "Holdout Test R²", unit: "" }
  ];

  const algoColors: Record<string, string> = {
    LassoCV: "#00f0ff",                          // Electric Cyan
    RFECV: "#a855f7",                            // Purple
    "Sequential Forward Selection": "#10b981",   // Mint Green
    ElasticNetCV: "#f43f5e",                     // Rose Pink
    "Exhaustive Feature Selection": "#f59e0b"    // Amber Orange
  };

  const algoDashArrays: Record<string, string> = {
    LassoCV: "0",
    RFECV: "6 3",
    "Sequential Forward Selection": "2 2",
    ElasticNetCV: "8 3 2 3",
    "Exhaustive Feature Selection": "4 4"
  };

  // Find exact data point corresponding to active dropdown selections
  const currentDetail = curves.find(
    (c) => c.algorithm === selectedAlgorithm && c.k === selectedK
  ) || curves.find((c) => c.k === selectedK) || curves[0];

  // Prepare chart data for Chart 1: RMSE (k = 1..5)
  const rmseChartData = [1, 2, 3, 4, 5].map((kVal) => {
    const entry: Record<string, number | string> = {
      kLabel: `k=${kVal}`,
      kNum: kVal
    };
    algorithmOptions.forEach((algo) => {
      const match = curves.find((c) => c.algorithm === algo.value && c.k === kVal);
      if (match) {
        entry[algo.value] = rmseChartView === "cv" ? match.cv_rmse : match.test_rmse;
      }
    });
    return entry;
  });

  // Prepare chart data for Chart 2: R² (k = 1..5)
  const r2ChartData = [1, 2, 3, 4, 5].map((kVal) => {
    const entry: Record<string, number | string> = {
      kLabel: `k=${kVal}`,
      kNum: kVal
    };
    algorithmOptions.forEach((algo) => {
      const match = curves.find((c) => c.algorithm === algo.value && c.k === kVal);
      if (match) {
        entry[algo.value] = r2ChartView === "cv" ? match.cv_r2 : match.test_r2;
      }
    });
    return entry;
  });

  const toggleLegendAlgo = (algoName: string) => {
    setHiddenAlgorithms((prev) => ({
      ...prev,
      [algoName]: !prev[algoName]
    }));
  };

  // Click on chart data point to update active dropdowns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = (e: any) => {
    if (e && e.activePayload && e.activePayload.length > 0) {
      const clickedK = e.activePayload[0].payload?.kNum;
      if (clickedK) {
        setSelectedK(clickedK);
      }
      if (e.activePayload[0].dataKey && typeof e.activePayload[0].dataKey === "string") {
        const clickedAlgo = e.activePayload[0].dataKey;
        if (algorithmOptions.some((a) => a.value === clickedAlgo)) {
          setSelectedAlgorithm(clickedAlgo);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Mandatory Three Dropdowns Control Header */}
      <Card glow="cyan">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Feature Selection Lab — Interactive Parameter Matrix
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Synchronized State
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dropdown 1: Algorithm */}
            <div className="space-y-1.5">
              <label htmlFor="algorithm-select" className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>1. Algorithm</span>
                <span className="text-[10px] font-normal text-slate-500">5 Methods</span>
              </label>
              <div className="relative">
                <select
                  id="algorithm-select"
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
                >
                  {algorithmOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown 2: Feature Count (k) */}
            <div className="space-y-1.5">
              <label htmlFor="feature-count-select" className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>2. Feature Count (k)</span>
                <span className="text-[10px] font-normal text-emerald-400">CV RMSE: k=3 · CV R²: k=2</span>
              </label>
              <div className="relative">
                <select
                  id="feature-count-select"
                  value={selectedK}
                  onChange={(e) => setSelectedK(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
                >
                  {featureCountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown 3: Metric */}
            <div className="space-y-1.5">
              <label htmlFor="metric-select" className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span>3. Evaluation Metric</span>
                <span className="text-[10px] font-normal text-slate-500">CV vs Test</span>
              </label>
              <div className="relative">
                <select
                  id="metric-select"
                  value={selectedMetric}
                  onChange={(e) =>
                    setSelectedMetric(
                      e.target.value as "cv_rmse" | "test_rmse" | "cv_r2" | "test_r2"
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
                >
                  {metricOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Synchronized Output Panel: Selected Features, Metrics & Model Parameters */}
      {currentDetail && (
        <Card glow="cyan">
          <CardHeader
            title={`Active Configuration: ${currentDetail.algorithm} (k = ${currentDetail.k})`}
            subtitle="Selected feature subset, parameter weights, and cross-validation / test evaluation."
            badge={
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                k = {currentDetail.k} / 5 Features
              </span>
            }
          />

          <div className="space-y-4">
            {/* 4 Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Selection CV RMSE (Train)</span>
                <span className="text-cyan-300 font-bold text-base">
                  ${currentDetail.cv_rmse.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">5-Fold Training Fold CV</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Selection CV R² (Train)</span>
                <span className="text-emerald-400 font-bold text-base">
                  {currentDetail.cv_r2.toFixed(4)}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Mean Determination</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Holdout Test RMSE</span>
                <span className="text-slate-200 font-bold text-base">
                  ${currentDetail.test_rmse.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Holdout (10 samples)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Holdout Test R²</span>
                <span className="text-emerald-400 font-bold text-base">
                  {currentDetail.test_r2.toFixed(4)}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Holdout Test Set</span>
              </div>
            </div>

            {/* Selected Features Chips */}
            <div>
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Selected Features Subset ({currentDetail.features.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {currentDetail.features.map((feat) => (
                  <span
                    key={feat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-mono text-xs font-semibold shadow-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Fitted Regression Coefficients */}
            <div>
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Fitted OLS Regression Parameters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-xs">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Intercept ($\beta_0$)</span>
                  <span className="text-cyan-300 font-bold">
                    ${currentDetail.intercept.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {Object.entries(currentDetail.coefficients).map(([feat, coef]) => (
                  <div
                    key={feat}
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-center"
                  >
                    <span className="text-slate-400 truncate max-w-[150px]">{feat}</span>
                    <span
                      className={
                        coef > 0
                          ? "text-emerald-400 font-bold"
                          : "text-rose-400 font-bold"
                      }
                    >
                      {coef > 0 ? `+${coef.toFixed(6)}` : coef.toFixed(6)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. The Two 5-Algorithm Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: RMSE vs. Number of Features */}
        <Card>
          <CardHeader
            title="1. RMSE vs. Number of Features"
            subtitle="CV RMSE is best at k=3. CV R² is best at k=2. Holdout metrics are descriptive only."
            action={
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setRmseChartView("cv")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    rmseChartView === "cv"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  CV RMSE (Train)
                </button>
                <button
                  onClick={() => setRmseChartView("test")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    rmseChartView === "test"
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Holdout Test RMSE
                </button>
              </div>
            }
          />

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rmseChartData}
                margin={{ top: 15, right: 15, left: 10, bottom: 15 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="kLabel"
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                  domain={rmseChartView === "cv" ? [9500, 10100] : [7500, 9200]}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1527",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace"
                  }}
                  formatter={(val) => [`$${Number(val).toFixed(2)}`, ""]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", paddingTop: "8px" }}
                  onClick={(e) => e && e.dataKey && toggleLegendAlgo(String(e.dataKey))}
                />
                {algorithmOptions.map((algo) => {
                  const isHidden = hiddenAlgorithms[algo.value];
                  const isSelected = selectedAlgorithm === algo.value;
                  return (
                    <Line
                      key={algo.value}
                      type="monotone"
                      dataKey={algo.value}
                      stroke={algoColors[algo.value]}
                      strokeWidth={isSelected ? 3.5 : 2}
                      strokeDasharray={algoDashArrays[algo.value]}
                      dot={{ r: isSelected ? 5 : 3.5 }}
                      hide={isHidden}
                      name={algo.value.replace("Sequential Forward Selection", "SFS").replace(" Feature Selection", "")}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-2 text-center">
            Tip: Click a data point to load that (Algorithm, k) configuration into the dropdowns.
          </p>
        </Card>

        {/* Chart 2: R² vs. Number of Features */}
        <Card>
          <CardHeader
            title="2. R² Score vs. Number of Features"
            subtitle="Comparing 5 algorithms across k=1..5. Click a point to inspect its model."
            action={
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setR2ChartView("cv")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    r2ChartView === "cv"
                      ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  CV R² (Train)
                </button>
                <button
                  onClick={() => setR2ChartView("test")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    r2ChartView === "test"
                      ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Holdout Test R²
                </button>
              </div>
            }
          />

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={r2ChartData}
                margin={{ top: 15, right: 15, left: 10, bottom: 15 }}
                onClick={handleChartClick}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="kLabel"
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                  domain={r2ChartView === "cv" ? [0.93, 0.945] : [0.89, 0.93]}
                  tickFormatter={(val) => Number(val).toFixed(3)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1527",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace"
                  }}
                  formatter={(val) => [Number(val).toFixed(4), "R²"]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", paddingTop: "8px" }}
                  onClick={(e) => e && e.dataKey && toggleLegendAlgo(String(e.dataKey))}
                />
                {algorithmOptions.map((algo) => {
                  const isHidden = hiddenAlgorithms[algo.value];
                  const isSelected = selectedAlgorithm === algo.value;
                  return (
                    <Line
                      key={algo.value}
                      type="monotone"
                      dataKey={algo.value}
                      stroke={algoColors[algo.value]}
                      strokeWidth={isSelected ? 3.5 : 2}
                      strokeDasharray={algoDashArrays[algo.value]}
                      dot={{ r: isSelected ? 5 : 3.5 }}
                      hide={isHidden}
                      name={algo.value.replace("Sequential Forward Selection", "SFS").replace(" Feature Selection", "")}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] font-mono text-slate-500 mt-2 text-center">
            Tip: Click a data point to load that (Algorithm, k) configuration into the dropdowns.
          </p>
        </Card>
      </div>

      <p className="-mt-3 px-2 text-[11px] leading-relaxed text-slate-400">Overlapping lines can occur when methods select the same feature subset and use the same OLS estimator, which gives the same fitted model. Feature selection identifies predictive associations in this dataset; it does not establish causal effects.</p>

      {currentDetail?.training_ols_statistics && (
        <Card>
          <CardHeader
            title="Training OLS Statistics"
            subtitle={`${currentDetail.algorithm} · k=${currentDetail.k} · ${currentDetail.training_ols_statistics.observations} training samples · OLS with intercept`}
            badge={<span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">TRAINING ONLY</span>}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 font-mono">
            {[
              ["Training R²", currentDetail.training_ols_statistics.r_squared.toFixed(5)],
              ["Adjusted R²", currentDetail.training_ols_statistics.adjusted_r_squared.toFixed(5)],
              ["F-statistic", currentDetail.training_ols_statistics.f_statistic?.toFixed(4) ?? "N/A"],
              ["F-test p-value", currentDetail.training_ols_statistics.f_p_value?.toExponential(3) ?? "N/A"]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                <span className="block text-[10px] text-slate-400">{label}</span>
                <span className="text-sm font-bold text-cyan-300">{value}</span>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left font-mono text-[11px]">
              <thead className="text-slate-400 bg-slate-900/70">
                <tr>
                  <th className="p-2.5">Feature</th><th className="p-2.5 text-right">Estimate</th>
                  <th className="p-2.5 text-right">Std. Error</th><th className="p-2.5 text-right">t-stat</th>
                  <th className="p-2.5 text-right">p-value</th><th className="p-2.5 text-right">95% CI</th>
                  <th className="p-2.5 text-right">VIF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentDetail.training_ols_statistics.coefficients.map((item) => (
                  <tr key={item.feature}>
                    <td className="p-2.5 text-slate-200">{item.feature}</td>
                    <td className="p-2.5 text-right text-cyan-300">{item.estimate.toFixed(6)}</td>
                    <td className="p-2.5 text-right text-slate-300">{item.std_error.toFixed(6)}</td>
                    <td className="p-2.5 text-right text-slate-300">{item.t_statistic.toFixed(4)}</td>
                    <td className="p-2.5 text-right text-slate-300">{item.p_value.toExponential(3)}</td>
                    <td className="p-2.5 text-right text-slate-300">[{item.ci_lower.toFixed(4)}, {item.ci_upper.toFixed(4)}]</td>
                    <td className="p-2.5 text-right text-amber-300" title={item.vif_note ?? undefined}>{item.vif === null ? "N/A" : item.vif.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-slate-500">These are in-sample training OLS statistics and are separate from cross-validation and holdout test metrics. VIF excludes the intercept; N/A means the value could not be estimated. P-values describe statistical evidence under this model and do not establish causation.</p>
        </Card>
      )}

      {/* 4. Complete 25-Row Experimental Results Table */}
      <Card>
        <CardHeader
          title="Complete 25-Configuration Experimental Results Table"
          subtitle="Sourced directly from feature_count_comparison.csv. Sorted by Algorithm and k."
        />

        <div className="overflow-x-auto max-h-[440px]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-[#0d1424] z-10">
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                <th className="py-2.5 px-3">Algorithm</th>
                <th className="py-2.5 px-3 text-center">k</th>
                <th className="py-2.5 px-3">Selected Features</th>
                <th className="py-2.5 px-3 text-right">Selection CV RMSE</th>
                <th className="py-2.5 px-3 text-right">Selection CV R²</th>
                <th className="py-2.5 px-3 text-right">Holdout Test RMSE</th>
                <th className="py-2.5 px-3 text-right">Holdout Test R²</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {curves.map((item, idx) => {
                const isCurrentActive =
                  item.algorithm === selectedAlgorithm && item.k === selectedK;
                const isOptimalK = item.k === 3;
                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      setSelectedAlgorithm(item.algorithm);
                      setSelectedK(item.k);
                    }}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      isCurrentActive
                        ? "bg-cyan-950/40 border-l-2 border-cyan-400"
                        : isOptimalK
                        ? "bg-slate-900/30"
                        : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-200 flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: algoColors[item.algorithm] }}
                      />
                      <span>{item.algorithm}</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isOptimalK
                            ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-800"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        k={item.k}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-[11px]">
                      {item.features.join(", ")}
                    </td>
                    <td className="py-2 px-3 text-right text-cyan-300 font-bold">
                      ${item.cv_rmse.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400">
                      {item.cv_r2.toFixed(4)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      ${item.test_rmse.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400">
                      {item.test_r2.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
