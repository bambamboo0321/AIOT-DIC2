import { Card, CardHeader } from "@/components/ui/Card";
import { Check, X } from "lucide-react";

interface Props {
  correlationWithProfit: Record<string, number>;
  optimalCoefficients: Record<string, number>;
}

export function SelectedFeaturesSummary({
  correlationWithProfit,
  optimalCoefficients
}: Props) {
  const featureList = [
    {
      name: "R&D Spend",
      type: "Continuous ($)",
      selectedBy: "5 / 5 Methods",
      status: "SELECTED",
      corr: correlationWithProfit["R&D Spend"] ?? 0.9729,
      coef: optimalCoefficients["R&D Spend"] ?? 0.803779,
      rationale: "Dominant profit predictor with strong linear correlation (r=0.973). Every $1 spend yields ~$0.80 in profit."
    },
    {
      name: "Marketing Spend",
      type: "Continuous ($)",
      selectedBy: "5 / 5 Methods",
      status: "SELECTED",
      corr: correlationWithProfit["Marketing Spend"] ?? 0.7478,
      coef: optimalCoefficients["Marketing Spend"] ?? 0.031242,
      rationale: "Secondary driver (r=0.748). Synergistic with R&D, contributing positive margin expansion."
    },
    {
      name: "Administration",
      type: "Continuous ($)",
      selectedBy: "5 / 5 Methods",
      status: "SELECTED",
      corr: correlationWithProfit["Administration"] ?? 0.2007,
      coef: optimalCoefficients["Administration"] ?? -0.067929,
      rationale: "Retained in the selected subset. The negative coefficient is a conditional association in this fitted model, not a causal effect."
    },
    {
      name: "State_Florida",
      type: "Dummy (0/1)",
      selectedBy: "Excluded at k=3 (Included at k=4,5)",
      status: "EXCLUDED AT k=3",
      corr: -0.017,
      coef: 0.0,
      rationale: "Excluded from the k=3 subset by SFS, Exhaustive, LassoCV, and ElasticNetCV. RFECV retained all five encoded features in its separate selection run."
    },
    {
      name: "State_New York",
      type: "Dummy (0/1)",
      selectedBy: "Excluded at k=3 (Included at k=4,5)",
      status: "EXCLUDED AT k=3",
      corr: 0.031,
      coef: 0.0,
      rationale: "Excluded in the optimal k=3 subset by SFS, Exhaustive, LassoCV, and ElasticNetCV. Re-added at k=4/5, providing low correlation (r=0.031) with profit."
    }
  ];

  return (
    <Card>
      <CardHeader
        title="Feature Selection Consensus & Attribution"
        subtitle="Detailed analysis of candidate features and why geographic dummy variables were eliminated."
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
            k=3 Consensus: 3 Core Features
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {featureList.map((f) => {
          const isSelected = f.status === "SELECTED";
          return (
            <div
              key={f.name}
              className={`p-3.5 rounded-lg border transition-all ${
                isSelected
                  ? "bg-[#0f1d38] border-cyan-500/30"
                  : "bg-slate-900/40 border-slate-800/80 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1.5">
                    {f.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">{f.type}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                    isSelected
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-3 w-3" />
                      Retained
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" />
                      Pruned
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded bg-slate-950/60 border border-slate-800/60 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Corr(Profit)</span>
                  <span
                    className={
                      f.corr > 0.5
                        ? "text-emerald-400 font-bold"
                        : f.corr > 0
                        ? "text-cyan-300"
                        : "text-slate-400"
                    }
                  >
                    {f.corr > 0 ? `+${f.corr.toFixed(3)}` : f.corr.toFixed(3)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">OLS Coef (Final)</span>
                  <span className="text-slate-200 font-semibold">
                    {isSelected ? f.coef.toFixed(4) : "0.0000"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{f.rationale}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
