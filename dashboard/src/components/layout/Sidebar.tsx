"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  SlidersHorizontal,
  GitCompare,
  Terminal,
  Cpu
} from "lucide-react";

const navigationItems = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
    badge: "Core",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
  },
  {
    name: "Dataset Explorer",
    href: "/dataset",
    icon: Database,
    badge: "50 Rows",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700"
  },
  {
    name: "Feature Selection Lab",
    href: "/feature-selection",
    icon: SlidersHorizontal,
    badge: "5 Methods",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  {
    name: "Model Comparison",
    href: "/comparison",
    icon: GitCompare,
    badge: "6 Models",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    name: "Prediction Playground",
    href: "/playground",
    icon: Terminal,
    badge: "Live",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0a0f1d] flex flex-col h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold tracking-tight text-white text-base">
                AIOT<span className="text-cyan-400">-DIC2</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                LAB
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans tracking-wide">
              ML Research & Analytics
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 py-4 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-medium">
          CRISP-DM Modules
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-slate-800/90 text-cyan-400 shadow-sm border border-slate-700/80"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                <span className={isActive ? "font-semibold" : ""}>{item.name}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor}`}
              >
                {item.badge}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Lab Environment Status */}
      <div className="p-3 border-t border-slate-800/80 bg-[#080d18]">
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Experiment Data Ready</span>
            </div>
            <span className="text-[10px] font-mono text-slate-300">v1.6.1</span>
          </div>

          <div className="pt-1.5 border-t border-slate-800/60 grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
            <div>
              <span className="text-slate-400">CV:</span> 5-Fold
            </div>
            <div>
              <span className="text-slate-400">Split:</span> 80/20
            </div>
            <div>
              <span className="text-slate-400">Target:</span> Profit
            </div>
            <div>
              <span className="text-slate-400">N:</span> 50 Startups
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
