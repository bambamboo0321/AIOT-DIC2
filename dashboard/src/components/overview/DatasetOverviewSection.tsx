import { DatasetSummary } from "@/types/ml";
import { Card, CardHeader } from "@/components/ui/Card";
import { MapPin, DollarSign, CheckCircle2 } from "lucide-react";

interface Props {
  dataset: DatasetSummary;
}

export function DatasetOverviewSection({ dataset }: Props) {
  const profitStats = dataset.statistics["Profit"];

  return (
    <Card>
      <CardHeader
        title="Dataset Architecture & Distribution Summary"
        subtitle="50_Startups exploratory baseline, split parameters, and geographic balance."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            50 Rows / 0 Missing
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* State Breakdown */}
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono font-semibold text-slate-200">
            <MapPin className="h-4 w-4 text-cyan-400" />
            <span>State Geographic Balance</span>
          </div>

          <div className="space-y-2.5">
            {dataset.state_distribution.map((item) => (
              <div key={item.state} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">{item.state}</span>
                  <span className="text-cyan-300 font-semibold">
                    {item.count} startups ({item.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${item.percentage * 2.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target Variable Profile */}
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs">
          <div className="flex items-center gap-2 mb-3 font-semibold text-slate-200">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span>Target: Profit ($ USD)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Mean Profit</span>
              <span className="text-slate-200 font-bold">
                ${profitStats?.mean.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Std Dev</span>
              <span className="text-slate-200 font-bold">
                ${profitStats?.std.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Min Profit</span>
              <span className="text-rose-400 font-bold">
                ${profitStats?.min.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Max Profit</span>
              <span className="text-emerald-400 font-bold">
                ${profitStats?.max.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Preprocessing Specifications */}
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 mb-1 font-semibold text-slate-200">
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            <span>Partitioning & Encoding</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Train Set (80%)</span>
              <span className="text-cyan-300 font-semibold">{dataset.train_samples} samples</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Test Set (20%)</span>
              <span className="text-cyan-300 font-semibold">{dataset.test_samples} samples</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Random State</span>
              <span className="text-slate-200">42 (Reproducible)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">One-Hot Encoding</span>
              <span className="text-slate-200">drop=&apos;first&apos;</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
