"use client";

import { usePathname } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Overview Dashboard",
    subtitle: "CRISP-DM Cycle & Multiple Linear Regression Benchmark"
  },
  "/dataset": {
    title: "Dataset Explorer",
    subtitle: "50_Startups Feature Distribution & Correlation Matrix"
  },
  "/feature-selection": {
    title: "Feature Selection Lab",
    subtitle: "LassoCV, RFECV, SFS, ElasticNetCV & Exhaustive Search"
  },
  "/comparison": {
    title: "Model Comparison",
    subtitle: "Evaluation Metrics, Residual Analysis & Out-of-Sample Diagnostics"
  },
  "/playground": {
    title: "Prediction Playground",
    subtitle: "Interactive OLS Prediction from Training Coefficients"
  }
};

interface HeaderProps {
  bestModelName?: string;
  bestCvRmse?: number;
}

export function Header({
  bestModelName = "LassoCV / SFS / Exhaustive",
  bestCvRmse = 9583.68
}: HeaderProps) {
  const pathname = usePathname();
  const current = pageTitles[pathname] || {
    title: "AIOT-DIC2 Research Lab",
    subtitle: "Machine Learning Workbench"
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0a0f1d]/90 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-cyan-400" />
        <div>
          <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            {current.title}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              CRISP-DM
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-sans">{current.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Best Model KPI Chip */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-slate-400">Best CV Model:</span>
          <span className="text-cyan-300 font-semibold">{bestModelName}</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-semibold">
            ${bestCvRmse.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-mono text-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Data Verified</span>
        </div>
      </div>
    </header>
  );
}
