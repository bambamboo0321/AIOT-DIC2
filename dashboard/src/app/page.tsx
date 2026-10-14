import { getDashboardData } from "@/lib/data";
import { MetricCard } from "@/components/ui/MetricCard";
import { ModelPerformanceOverview } from "@/components/overview/ModelPerformanceOverview";
import { SelectedFeaturesSummary } from "@/components/overview/SelectedFeaturesSummary";
import { CRISPDMWorkflow } from "@/components/overview/CRISPDMWorkflow";
import { DatasetOverviewSection } from "@/components/overview/DatasetOverviewSection";
import {
  Database,
  SlidersHorizontal,
  Trophy,
  Sparkles
} from "lucide-react";

export default function OverviewPage() {
  const data = getDashboardData();
  const minCvRmse = Math.min(...data.models.map((m) => m.cv_rmse));
  const tiedBestModels = data.models.filter(
    (m) => Math.abs(m.cv_rmse - minCvRmse) < 1e-2
  );
  const bestModel = tiedBestModels[0];
  const isTie = tiedBestModels.length > 1;

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Dataset Samples"
          value={data.dataset_summary.total_samples}
          subValue="Rows"
          icon={Database}
          accentColor="cyan"
          description="80% Training (40) / 20% Testing (10). Split with random_state=42."
          badge="50_Startups.csv"
          badgeVariant="cyan"
        />

        <MetricCard
          title="Engineered Features"
          value={data.dataset_summary.encoded_features.length}
          subValue="Inputs"
          icon={SlidersHorizontal}
          accentColor="blue"
          description="3 numerical spends + 2 one-hot state dummies (California dropped as reference)."
          badge="drop='first'"
          badgeVariant="default"
        />

        <MetricCard
          title="Best Selection CV Score"
          value={`$${bestModel.cv_rmse.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subValue="CV RMSE (Train)"
          icon={Trophy}
          accentColor="mint"
          description={
            isTie
              ? `Tie (${tiedBestModels.length} models: ${tiedBestModels.map((m) => m.name.replace("Sequential Forward Selection", "SFS").replace(" Feature Selection", "")).join(", ")}). Features selected on full train fold.`
              : `Selected: ${bestModel.name}. Ranked strictly by 5-fold cross-validation RMSE.`
          }
          badge={isTie ? "Tie (k=3 Optimal)" : "3 Features"}
          badgeVariant="mint"
        />

        <MetricCard
          title="Holdout Test Metrics"
          value={`R² ${(bestModel.test_r2 * 100).toFixed(2)}%`}
          subValue={`RMSE $${bestModel.test_rmse.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={Sparkles}
          accentColor="purple"
          description={`Test R² = ${bestModel.test_r2.toFixed(4)}, Test RMSE = $${bestModel.test_rmse.toFixed(2)}. (Note: k=1 had Test RMSE $7,714.33 on this 10-sample test set).`}
          badge="Holdout Test Set"
          badgeVariant="cyan"
        />
      </div>

      {/* Main Benchmark & Model Comparison */}
      <ModelPerformanceOverview
        models={data.models}
        bestModelId={bestModel.id}
      />

      {/* Feature Selection Consensus */}
      <SelectedFeaturesSummary
        correlationWithProfit={data.dataset_summary.correlation.with_profit}
        optimalCoefficients={bestModel.coefficients}
      />

      {/* CRISP-DM Lifecycle Stepper */}
      <CRISPDMWorkflow phases={data.crispdm} />

      {/* Dataset Exploration Quick Stats */}
      <DatasetOverviewSection dataset={data.dataset_summary} />
    </div>
  );
}
