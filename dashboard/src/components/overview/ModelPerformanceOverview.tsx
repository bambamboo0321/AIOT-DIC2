"use client";

import { useState } from "react";
import { ModelEvaluation } from "@/types/ml";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Trophy, Info } from "lucide-react";

interface Props {
  models: ModelEvaluation[];
  bestModelId: string;
}

export function ModelPerformanceOverview({ models, bestModelId }: Props) {
  const [metricMode, setMetricMode] = useState<"rmse" | "r2">("rmse");

  // Models sorted by Training CV RMSE (ascending: lowest error first)
  const sortedModels = [...models].sort((a, b) => a.cv_rmse - b.cv_rmse);

  const chartData = sortedModels.map((m) => ({
    name: m.name.replace("Sequential Forward Selection", "SFS").replace("Exhaustive Feature Selection", "Exhaustive"),
    fullName: m.name,
    "CV RMSE": m.cv_rmse,
    "Test RMSE": m.test_rmse,
    "Test R2": m.test_r2,
    features: m.features.length,
    isBest: m.id === bestModelId
  }));

  return (
    <Card glow="cyan">
      <CardHeader
        title="Model Performance Benchmark (Sorted by Training CV RMSE)"
        subtitle="Ranked strictly by cross-validation error on training set (5-Fold CV) as per CRISP-DM standard."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            6 Models
          </span>
        }
        action={
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setMetricMode("rmse")}
              className={`px-2.5 py-1 rounded transition-colors ${
                metricMode === "rmse"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              RMSE (CV vs Test)
            </button>
            <button
              onClick={() => setMetricMode("r2")}
              className={`px-2.5 py-1 rounded transition-colors ${
                metricMode === "r2"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Test R² Score
            </button>
          </div>
        }
      />

      {/* Chart Section */}
      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricMode === "rmse" ? (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
                domain={[8500, 10200]}
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
                wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "8px" }}
              />
              <Bar dataKey="CV RMSE" fill="#00f0ff" radius={[4, 4, 0, 0]} name="Train CV RMSE" />
              <Bar dataKey="Test RMSE" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Test RMSE" />
            </BarChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                fontFamily="monospace"
                domain={[0.88, 0.92]}
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
                formatter={(val) => [Number(val).toFixed(4), "Test R²"]}
              />
              <Bar dataKey="Test R2" fill="#10b981" radius={[4, 4, 0, 0]} name="Test R² Score" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Model Table Breakdown */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
              <th className="py-2.5 px-3">Rank / Model</th>
              <th className="py-2.5 px-3">Method Type</th>
              <th className="py-2.5 px-3 text-center">Features</th>
              <th className="py-2.5 px-3 text-right">Selection CV RMSE (Train)</th>
              <th className="py-2.5 px-3 text-right">Holdout Test RMSE</th>
              <th className="py-2.5 px-3 text-right">Holdout Test R²</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedModels.map((m, idx) => {
              const isBest = Math.abs(m.cv_rmse - sortedModels[0].cv_rmse) < 1e-2;
              return (
                <tr
                  key={m.id}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    isBest ? "bg-cyan-950/20" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                    {isBest ? (
                      <Trophy className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <span className="text-slate-400 w-3.5 text-center">#{idx + 1}</span>
                    )}
                    <span>{m.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{m.category}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        m.num_features === 3
                          ? "bg-cyan-500/10 text-cyan-300 border border-cyan-800/60"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {m.num_features} / 5
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
                  <td className="py-2.5 px-3 text-center">
                    {isBest ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Tie (Optimal Subset)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Baseline
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
        <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">Consensus Note:</strong> LassoCV, SFS, ElasticNetCV, and Exhaustive Search all converged on the exact same 3 features (<code className="text-cyan-300">R&D Spend</code>, <code className="text-cyan-300">Administration</code>, <code className="text-cyan-300">Marketing Spend</code>). Since all 4 methods train the same Ordinary Least Squares model on this subset, their CV and test metrics are identical.
        </p>
      </div>
    </Card>
  );
}
