"use client";

import { useMemo, useState } from "react";
import { getDashboardData } from "@/lib/data";
import { Card, CardHeader } from "@/components/ui/Card";
import { ChevronDown, Activity } from "lucide-react";

const algorithms = [
  "LassoCV",
  "RFECV",
  "Sequential Forward Selection",
  "ElasticNetCV",
  "Exhaustive Feature Selection"
];
const formatMoney = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PlaygroundPage() {
  const curves = getDashboardData().feature_count_curves ?? [];
  const [algorithm, setAlgorithm] = useState(algorithms[0]);
  const [k, setK] = useState(3);
  const [spend, setSpend] = useState({ rd: "100000", administration: "120000", marketing: "200000" });
  const [state, setState] = useState("California");
  const detail = curves.find((curve) => curve.algorithm === algorithm && curve.k === k);

  const values = useMemo(() => ({
    "R&D Spend": Number(spend.rd),
    Administration: Number(spend.administration),
    "Marketing Spend": Number(spend.marketing),
    "State_Florida": state === "Florida" ? 1 : 0,
    "State_New York": state === "New York" ? 1 : 0
  }), [spend, state]);
  const invalidField = Object.entries(spend).find(([, raw]) => {
    const value = Number(raw);
    return raw.trim() === "" || !Number.isFinite(value) || value < 0 || value > 1_000_000_000;
  });
  const prediction = detail && !invalidField
    ? detail.intercept + detail.features.reduce((sum, feature) => sum + detail.coefficients[feature] * values[feature as keyof typeof values], 0)
    : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <Card glow="cyan">
        <CardHeader
          title="Live Profit Predictor"
          subtitle="Client-side OLS prediction using the exported training coefficients and State encoding."
          badge={<span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">MODEL READY</span>}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            {([
              ["R&D Spend", "rd"],
              ["Administration", "administration"],
              ["Marketing Spend", "marketing"]
            ] as const).map(([label, key]) => (
              <label key={key} className="block space-y-1.5">
                <span className="text-xs font-mono text-slate-300">{label} ($)</span>
                <input
                  type="number" min="0" max="1000000000" step="any" inputMode="decimal"
                  value={spend[key]}
                  onChange={(event) => setSpend((current) => ({ ...current, [key]: event.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-cyan-400"
                  aria-label={label}
                />
              </label>
            ))}
            <label className="block space-y-1.5">
              <span className="text-xs font-mono text-slate-300">State</span>
              <select value={state} onChange={(event) => setState(event.target.value)} className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-mono text-sm text-cyan-300 outline-none focus:border-cyan-400">
                {["California", "Florida", "New York"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            {invalidField && <p role="alert" className="text-xs text-rose-300">Enter a finite, non-negative amount up to $1,000,000,000 for each spend field.</p>}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-mono text-slate-300">Algorithm</span>
                <span className="relative block"><select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)} className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-9 font-mono text-xs text-cyan-300 outline-none focus:border-cyan-400">
                  {algorithms.map((item) => <option key={item}>{item}</option>)}
                </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></span>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-mono text-slate-300">Feature Count (k)</span>
                <span className="relative block"><select value={k} onChange={(event) => setK(Number(event.target.value))} className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-9 font-mono text-xs text-white outline-none focus:border-cyan-400">
                  {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>k = {count}</option>)}
                </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></span>
              </label>
            </div>

            <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/25 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-300"><Activity className="h-4 w-4" /> Estimated Profit</div>
              <div aria-live="polite" className="mt-2 break-words text-3xl sm:text-4xl font-mono font-bold text-white">{prediction === null ? "—" : formatMoney(prediction)}</div>
              <p className="mt-2 text-[11px] text-slate-400">Model estimate from the selected OLS configuration; it is not a guarantee of actual profit.</p>
            </div>

            {detail && <>
              <div>
                <h3 className="mb-2 text-xs font-mono font-bold uppercase tracking-wide text-slate-300">Active Features ({detail.features.length})</h3>
                <div className="flex flex-wrap gap-2">{detail.features.map((feature) => <span key={feature} className="rounded-md border border-emerald-800/70 bg-emerald-950/30 px-2 py-1 font-mono text-[11px] text-emerald-300">{feature}</span>)}</div>
                <p className="mt-2 text-[10px] text-slate-500">All other input features are excluded from this model&apos;s prediction.</p>
                <p className="mt-1 text-[10px] text-slate-500">State uses California as the reference; Florida and New York are encoded as indicator columns.</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
                <h3 className="mb-2 text-xs font-mono font-bold text-slate-300">Regression Equation</h3>
                <p className="break-words font-mono text-[11px] leading-relaxed text-cyan-200">Profit = {detail.intercept.toPrecision(12)}{detail.features.map((feature) => ` ${detail.coefficients[feature] < 0 ? "−" : "+"} ${Math.abs(detail.coefficients[feature]).toPrecision(12)} × ${feature}`).join("")}</p>
              </div>
            </>}
          </div>
        </div>
      </Card>
    </div>
  );
}
