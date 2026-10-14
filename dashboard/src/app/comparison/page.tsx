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
  Legend,
  BarChart,
  Bar,
  ReferenceLine
} from "recharts";
import { GitCompare, Info, Check, ChevronDown } from "lucide-react";

export default function ModelComparisonPage() {
  const data = getDashboardData();
  const models = data.models;

  // Selected models for comparison (default: M0 Baseline OLS + M1 LassoCV + M2 RFECV)
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([
    "M0",
    "M1",
    "M2"
  ]);

  // Metric / Chart Dropdown state
  const [chartViewMode, setChartViewMode] = useState<"actual_vs_predicted" | "residuals" | "metrics_comparison">("actual_vs_predicted");

  const toggleModel = (id: string) => {
    if (selectedModelIds.includes(id)) {
      if (selectedModelIds.length > 1) {
        setSelectedModelIds(selectedModelIds.filter((m) => m !== id));
      }
    } else {
      setSelectedModelIds([...selectedModelIds, id]);
    }
  };

  const selectedModels = models.filter((m) => selectedModelIds.includes(m.id));

  // Actual vs Predicted Chart Data (10 test samples sorted by actual ground truth)
  const groundTruth = data.test_ground_truth.sort((a, b) => a.actual - b.actual);
  const actualVsPredData = groundTruth.map((gt, sampleIdx) => {
    const entry: Record<string, number | string> = {
      sample: `Sample #${gt.sample_id}`,
      index: sampleIdx + 1,
      Actual: gt.actual
    };

    selectedModels.forEach((m) => {
      const predObj = m.predictions.find((p) => p.sample_id === gt.sample_id);
      if (predObj) {
        entry[m.name] = predObj.predicted;
        entry[`${m.name}_residual`] = predObj.residual;
      }
    });

    return entry;
  });

  // Metrics comparison bar chart data across selected models
  const metricsBarData = selectedModels.map((m) => ({
    name: m.name.replace("Sequential Forward Selection", "SFS").replace(" Feature Selection", ""),
    fullName: m.name,
    "CV RMSE": m.cv_rmse,
    "Test RMSE": m.test_rmse,
    "Test MAE": m.test_mae,
    "Test R2": m.test_r2
  }));

  const selectedFeatureSets = selectedModels.map((model) => model.features.slice().sort().join("|"));
  const hasMultipleIdenticalModels = new Set(selectedFeatureSets).size < selectedFeatureSets.length;
  const residualRows = selectedModels.map((model) => ({
    model,
    predictions: model.predictions.slice().sort((a, b) => b.abs_error - a.abs_error).slice(0, 10)
  }));

  const modelColors: Record<string, string> = {
    M0: "#f59e0b", // Amber for Baseline
    M1: "#00f0ff", // Cyan for LassoCV
    M2: "#a855f7", // Purple for RFECV
    M3: "#38bdf8", // Blue for SFS
    M4: "#ec4899", // Pink for ElasticNet
    M5: "#10b981"  // Emerald for Exhaustive
  };

  const modelDashArrays: Record<string, string> = {
    M0: "5 5",
    M1: "0",
    M2: "6 3",
    M3: "2 2",
    M4: "8 3 2 3",
    M5: "4 4"
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Selection Notice */}
      <Card glow="cyan">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Multi-Model Diagnostic Suite
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select models below to inspect out-of-sample predictions, error variance, and parameter weights.
            </p>
          </div>

          {/* Model Toggle Chips */}
          <div className="flex flex-wrap gap-2">
            {models.map((m) => {
              const isChecked = selectedModelIds.includes(m.id);
              const color = modelColors[m.id] || "#38bdf8";
              return (
                <button
                  key={m.id}
                  onClick={() => toggleModel(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    isChecked
                      ? "bg-slate-800 text-white border-slate-600 shadow-sm"
                      : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: isChecked ? color : "#475569" }}
                  />
                  <span>{m.name}</span>
                  {isChecked && <Check className="h-3 w-3 text-cyan-400 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {hasMultipleIdenticalModels && (
          <div className="mt-4 p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-start gap-2">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong>Notice on Prediction Overlap:</strong> Selected methods that use the same feature subset and the same OLS estimator produce the same fitted predictions, so their curves overlap.
            </p>
          </div>
        )}
      </Card>

      {/* Main Chart Card with Metric / Chart Dropdown */}
      <Card>
        <CardHeader
          title={
            chartViewMode === "actual_vs_predicted"
              ? "Actual vs. Predicted Profit Curve (Test Set)"
              : chartViewMode === "residuals"
              ? "Residual Error Distribution ($ USD)"
              : "RMSE / MAE / R² Metrics Comparison"
          }
          subtitle={
            chartViewMode === "actual_vs_predicted"
              ? "10 test samples sorted by ground truth profit. Baseline (M0, 5 features) vs Feature Selection."
              : chartViewMode === "residuals"
              ? "Residual = Actual Profit - Predicted Profit. Values closer to $0 indicate higher accuracy."
              : "Side-by-side comparative error loss and goodness-of-fit across selected models."
          }
          action={
            <div className="flex items-center gap-2">
              <label htmlFor="comparison-chart-select" className="text-xs font-mono text-slate-400 hidden sm:inline">
                View Mode:
              </label>
              <div className="relative">
                <select
                  id="comparison-chart-select"
                  value={chartViewMode}
                  onChange={(e) =>
                    setChartViewMode(
                      e.target.value as
                        | "actual_vs_predicted"
                        | "residuals"
                        | "metrics_comparison"
                    )
                  }
                  className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
                >
                  <option value="actual_vs_predicted">Actual vs Predicted</option>
                  <option value="residuals">Residual Errors</option>
                  <option value="metrics_comparison">RMSE / MAE / R² Comparison</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          }
        />

        <div className="h-80 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartViewMode === "actual_vs_predicted" ? (
              <LineChart
                data={actualVsPredData}
                margin={{ top: 15, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="sample"
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1527",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace"
                  }}
                  formatter={(val) => [
                    `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    ""
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "12px" }}
                />
                <Line
                  type="monotone"
                  dataKey="Actual"
                  stroke="#ffffff"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#ffffff" }}
                  name="Ground Truth Profit"
                />
                {selectedModels.map((m) => {
                  const color = modelColors[m.id] || "#38bdf8";
                  return (
                    <Line
                      key={m.id}
                      type="monotone"
                      dataKey={m.name}
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={modelDashArrays[m.id]}
                      dot={{ r: 3 }}
                      name={`${m.name} (${m.num_features} feats)`}
                    />
                  );
                })}
              </LineChart>
            ) : chartViewMode === "residuals" ? (
              <BarChart
                data={actualVsPredData}
                margin={{ top: 15, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="sample"
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
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
                  formatter={(val) => [`$${Number(val).toFixed(2)}`, "Residual"]}
                />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "12px" }}
                />
                {selectedModels.map((m) => {
                  const color = modelColors[m.id] || "#38bdf8";
                  return (
                    <Bar
                      key={m.id}
                      dataKey={`${m.name}_residual`}
                      fill={color}
                      name={`${m.name} Residual`}
                    />
                  );
                })}
              </BarChart>
            ) : (
              <BarChart
                data={metricsBarData}
                margin={{ top: 15, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                  domain={[6000, 10200]}
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
                  wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "12px" }}
                />
                <Bar dataKey="CV RMSE" fill="#00f0ff" radius={[4, 4, 0, 0]} name="Selection CV RMSE (Train)" />
                <Bar dataKey="Test RMSE" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Holdout Test RMSE" />
                <Bar dataKey="Test MAE" fill="#a855f7" radius={[4, 4, 0, 0]} name="Holdout Test MAE" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Test Set Residuals & Error Diagnostics"
          subtitle="Holdout samples ranked by absolute error for the selected models. Residual = Actual − Predicted."
        />
        <div className="space-y-5">
          {residualRows.map(({ model, predictions }) => (
            <section key={model.id}>
              <h3 className="mb-2 font-mono text-xs font-bold text-cyan-300">{model.name}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-right font-mono text-[11px]">
                  <thead className="bg-slate-900/70 text-slate-400">
                    <tr>
                      <th className="p-2 text-center">Rank</th><th className="p-2 text-left">Sample ID</th>
                      <th className="p-2">Actual Profit</th><th className="p-2">Predicted Profit</th>
                      <th className="p-2">Residual</th><th className="p-2">Absolute Error</th>
                      <th className="p-2">Percentage Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {predictions.map((prediction, index) => (
                      <tr key={prediction.sample_id}>
                        <td className="p-2 text-center text-amber-300">{index + 1}</td>
                        <td className="p-2 text-left text-slate-200">{prediction.sample_id}</td>
                        <td className="p-2 text-slate-300">${prediction.actual.toLocaleString()}</td>
                        <td className="p-2 text-slate-300">${prediction.predicted.toLocaleString()}</td>
                        <td className={`p-2 ${prediction.residual < 0 ? "text-rose-300" : "text-emerald-300"}`}>${prediction.residual.toLocaleString()}</td>
                        <td className="p-2 font-bold text-cyan-300">${prediction.abs_error.toLocaleString()}</td>
                        <td className="p-2 text-slate-300">{prediction.pct_error.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-slate-500">Larger residuals describe larger errors on these holdout samples; they do not, by themselves, identify statistical outliers.</p>
      </Card>

      {/* Side-by-Side Metrics & Coefficient Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Out-of-Sample Metrics Comparison Table */}
        <Card>
          <CardHeader
            title="Comparison Matrix"
            subtitle="Side-by-side evaluation metrics across selected candidate models."
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3 text-center">Feats</th>
                  <th className="py-2.5 px-3 text-right">Selection CV RMSE</th>
                  <th className="py-2.5 px-3 text-right">Holdout Test RMSE</th>
                  <th className="py-2.5 px-3 text-right">Holdout Test R²</th>
                  <th className="py-2.5 px-3 text-right">Holdout Test MAE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {selectedModels.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: modelColors[m.id] }}
                      />
                      <span>{m.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {m.num_features}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">
                      ${m.cv_rmse.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      ${m.test_rmse.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      {m.test_r2.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      ${m.test_mae.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Regression Coefficients Inspector */}
        <Card>
          <CardHeader
            title="Regression Equation & Coefficients"
            subtitle="Learned parameters fitted via OLS on the respective feature subset."
          />

          <div className="space-y-4">
            {selectedModels.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: modelColors[m.id] }}
                    />
                    <span className="font-bold text-slate-200">{m.name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    Intercept: <code className="text-cyan-300">${m.intercept.toFixed(2)}</code>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(m.coefficients).map(([feat, coef]) => (
                    <div
                      key={feat}
                      className="p-1.5 rounded bg-slate-950/80 border border-slate-800/60 flex justify-between text-[11px]"
                    >
                      <span className="text-slate-400 truncate max-w-[140px]">{feat}</span>
                      <span
                        className={
                          coef > 0
                            ? "text-emerald-400 font-semibold"
                            : coef < 0
                            ? "text-rose-400 font-semibold"
                            : "text-slate-400"
                        }
                      >
                        {coef > 0 ? `+${coef.toFixed(6)}` : coef.toFixed(6)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
