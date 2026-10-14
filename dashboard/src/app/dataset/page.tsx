"use client";

import { useState } from "react";
import { getDashboardData } from "@/lib/data";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { Search, ArrowUpDown, Filter, ChevronDown, BarChart2 } from "lucide-react";

export default function DatasetExplorerPage() {
  const data = getDashboardData();
  const summary = data.dataset_summary;
  const records = summary.records;

  // 1. Feature Dropdown for Distribution Analysis
  const [selectedFeature, setSelectedFeature] = useState<"R&D Spend" | "Administration" | "Marketing Spend" | "Profit">("Profit");

  // Feature key mapping
  const featureKeyMap = {
    "R&D Spend": "rd_spend",
    "Administration": "administration",
    "Marketing Spend": "marketing_spend",
    "Profit": "profit"
  } as const;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"profit" | "rd_spend" | "marketing_spend" | "administration">("profit");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Compute distribution histogram bins for the selected feature
  const activeKey = featureKeyMap[selectedFeature];
  const featureValues = records.map((r) => r[activeKey]);
  const stats = summary.statistics[selectedFeature];

  const minVal = stats ? stats.min : Math.min(...featureValues);
  const maxVal = stats ? stats.max : Math.max(...featureValues);
  const numBins = 8;
  const binStep = (maxVal - minVal) / numBins;

  const distributionData = Array.from({ length: numBins }, (_, i) => {
    const binStart = minVal + i * binStep;
    const binEnd = binStart + binStep;
    const count = featureValues.filter((v) =>
      i === numBins - 1
        ? v >= binStart && v <= binEnd
        : v >= binStart && v < binEnd
    ).length;

    return {
      binRange: `$${Math.round(binStart / 1000)}k-${Math.round(binEnd / 1000)}k`,
      start: binStart,
      count
    };
  });

  // Table filtering & sorting
  const filteredRecords = records
    .filter((r) => {
      const matchesSearch =
        r.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.id).includes(searchTerm);
      const matchesState = selectedState === "ALL" || r.state === selectedState;
      return matchesSearch && matchesState;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature Distribution Section with Feature Dropdown */}
      <Card glow="cyan">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Feature Distribution & Descriptive Statistics
              </h2>
            </div>

            {/* Feature Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="feature-distribution-select" className="text-xs font-mono text-slate-400">Select Feature:</label>
              <div className="relative">
                <select
                  id="feature-distribution-select"
                  value={selectedFeature}
                  onChange={(e) =>
                    setSelectedFeature(
                      e.target.value as
                        | "R&D Spend"
                        | "Administration"
                        | "Marketing Spend"
                        | "Profit"
                    )
                  }
                  className="bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer shadow-sm"
                >
                  <option value="R&D Spend">R&D Spend</option>
                  <option value="Administration">Administration</option>
                  <option value="Marketing Spend">Marketing Spend</option>
                  <option value="Profit">Profit (Target)</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4 Summary Stat Cards: Mean, Min, Max, Std */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Mean</span>
                <span className="text-cyan-300 font-bold text-base">
                  ${stats.mean.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Average Value</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Minimum</span>
                <span className="text-rose-400 font-bold text-base">
                  ${stats.min.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Lowest Sample</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Maximum</span>
                <span className="text-emerald-400 font-bold text-base">
                  ${stats.max.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Highest Sample</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Standard Deviation</span>
                <span className="text-slate-200 font-bold text-base">
                  ${stats.std.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Spread / Dispersion</span>
              </div>
            </div>
          )}

          {/* Histogram Chart */}
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributionData}
                margin={{ top: 10, right: 15, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="binRange"
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  fontFamily="monospace"
                  allowDecimals={false}
                  label={{ value: "Frequency", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d1527",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace"
                  }}
                  formatter={(val) => [`${val} Startups`, "Count"]}
                />
                <Bar
                  dataKey="count"
                  fill="#00f0ff"
                  radius={[4, 4, 0, 0]}
                  name="Number of Startups"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Top Controls & Search for Records Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search state or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-52"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                aria-label="Filter records by state"
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">All States (50)</option>
                <option value="New York">New York (17)</option>
                <option value="California">California (17)</option>
                <option value="Florida">Florida (16)</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Showing</span>
            <span className="text-cyan-300 font-bold">{filteredRecords.length}</span>
            <span>of 50 Startups</span>
          </div>
        </div>
      </Card>

      {/* Main Records Table */}
      <Card>
        <CardHeader
          title="50_Startups Primary Records Table"
          subtitle="Real dataset values used across all 6 regression experiments."
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              CSV Source
            </span>
          }
        />

        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-[#0d1424] z-10">
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">#</th>
                <th
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                  onClick={() => toggleSort("rd_spend")}
                >
                  <div className="flex items-center gap-1">
                    <span>R&D Spend</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                  onClick={() => toggleSort("administration")}
                >
                  <div className="flex items-center gap-1">
                    <span>Administration</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                  onClick={() => toggleSort("marketing_spend")}
                >
                  <div className="flex items-center gap-1">
                    <span>Marketing Spend</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">State</th>
                <th
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort("profit")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Profit (Target)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-slate-400">{r.id}</td>
                  <td className="py-2 px-3 text-slate-200">
                    ${r.rd_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    ${r.administration.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    ${r.marketing_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                      {r.state}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-400">
                    ${r.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Correlation Matrix */}
      <Card>
        <CardHeader
          title="Pearson Correlation Matrix"
          subtitle="Pairwise linear correlation coefficients between numerical inputs and target Profit."
        />

        <div className="overflow-x-auto">
          <table className="w-full text-center font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                <th className="py-2 px-3 text-left">Feature</th>
                {summary.correlation.columns.map((col) => (
                  <th key={col} className="py-2 px-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {summary.correlation.columns.map((rowName, rowIdx) => (
                <tr key={rowName} className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-3 text-left font-semibold text-slate-200">
                    {rowName}
                  </td>
                  {summary.correlation.matrix[rowIdx].map((val, colIdx) => {
                    const isDiag = rowIdx === colIdx;
                    const isHigh = Math.abs(val) > 0.7;
                    return (
                      <td key={colIdx} className="py-2.5 px-3">
                        <span
                          className={`px-2 py-1 rounded text-[11px] ${
                            isDiag
                              ? "bg-slate-800 text-slate-400"
                              : isHigh
                              ? "bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800"
                              : val > 0
                              ? "text-cyan-300 font-medium"
                              : "text-slate-400"
                          }`}
                        >
                          {val.toFixed(4)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
