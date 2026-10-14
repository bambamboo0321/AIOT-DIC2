"use client";

import { useState } from "react";
import { CRISPPhase } from "@/types/ml";
import { Card, CardHeader } from "@/components/ui/Card";
import { CheckCircle2, Clock } from "lucide-react";

interface Props {
  phases: CRISPPhase[];
}

export function CRISPDMWorkflow({ phases }: Props) {
  const [selectedPhase, setSelectedPhase] = useState<CRISPPhase>(phases[3] || phases[0]);

  return (
    <Card>
      <CardHeader
        title="CRISP-DM Research Lifecycle"
        subtitle="Cross-Industry Standard Process for Data Mining execution status and transition metrics."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            Phase 1-5 Done / Phase 6 Active
          </span>
        }
      />

      {/* Workflow Stepper Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {phases.map((p) => {
          const isSelected = selectedPhase.id === p.id;
          const isCompleted = p.status === "COMPLETED";
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPhase(p)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-slate-800 border-cyan-400/80 shadow-[0_0_15px_-3px_rgba(0,240,255,0.2)]"
                  : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] text-cyan-400 font-bold">
                  PHASE 0{p.number}
                </span>
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                )}
              </div>
              <h4 className="text-xs font-semibold text-slate-200 truncate">{p.name}</h4>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded mt-2 inline-block border ${
                  isCompleted
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                    : "bg-amber-950/80 text-amber-300 border-amber-800"
                }`}
              >
                {p.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Phase Detail Drawer */}
      <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <h4 className="text-sm font-semibold font-mono text-cyan-300">
              Phase 0{selectedPhase.number}: {selectedPhase.name}
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Active Inspection
          </span>
        </div>

        <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
          {selectedPhase.summary}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
          {Object.entries(selectedPhase.metrics).map(([k, v]) => (
            <div key={k} className="p-2 rounded bg-slate-900/80 border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 text-[10px] block">{k}</span>
              <span className="text-slate-200 font-semibold">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
