import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: "cyan" | "mint" | "default" | "warning";
  accentColor?: "cyan" | "mint" | "blue" | "purple";
  description?: string;
}

export function MetricCard({
  title,
  value,
  subValue,
  icon: Icon,
  badge,
  badgeVariant = "default",
  accentColor = "cyan",
  description
}: MetricCardProps) {
  const iconColors = {
    cyan: "text-cyan-400 bg-cyan-950/60 border-cyan-800/40",
    mint: "text-emerald-400 bg-emerald-950/60 border-emerald-800/40",
    blue: "text-blue-400 bg-blue-950/60 border-blue-800/40",
    purple: "text-purple-400 bg-purple-950/60 border-purple-800/40"
  };

  const badgeColors = {
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    mint: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    default: "bg-slate-800 text-slate-300 border-slate-700",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/30"
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 transition-all hover:border-slate-700 hover:bg-[#0f172a]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${iconColors[accentColor]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {value}
          </span>
          {subValue && (
            <span className="text-xs font-mono text-slate-400">{subValue}</span>
          )}
        </div>

        {description && (
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {badge && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Specification</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${badgeColors[badgeVariant]}`}>
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}
