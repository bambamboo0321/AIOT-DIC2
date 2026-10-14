import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: "cyan" | "mint" | "none";
}

export function Card({ children, className = "", glow = "none", ...props }: CardProps) {
  const glowStyles = {
    none: "border-slate-800 bg-[#0d1424]",
    cyan: "border-cyan-500/30 bg-[#0d1424] shadow-[0_0_20px_-5px_rgba(0,240,255,0.08)]",
    mint: "border-emerald-500/30 bg-[#0d1424] shadow-[0_0_20px_-5px_rgba(16,185,129,0.08)]"
  };

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${glowStyles[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  badge,
  action
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between pb-4 border-b border-slate-800/80 mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-100 tracking-tight">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
