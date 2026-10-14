export interface ColumnInfo {
  name: string;
  type: string;
  missing: number;
}

export interface DescriptiveStat {
  count: number;
  mean: number;
  std: number;
  min: number;
  "25%": number;
  "50%": number;
  "75%": number;
  max: number;
}

export interface StateDistItem {
  state: string;
  count: number;
  percentage: number;
}

export interface CorrelationData {
  columns: string[];
  matrix: number[][];
  with_profit: Record<string, number>;
}

export interface RawRecord {
  id: number;
  rd_spend: number;
  administration: number;
  marketing_spend: number;
  state: string;
  profit: number;
}

export interface DatasetSummary {
  total_samples: number;
  train_samples: number;
  test_samples: number;
  target: string;
  original_features: string[];
  encoded_features: string[];
  columns: ColumnInfo[];
  statistics: Record<string, DescriptiveStat>;
  state_distribution: StateDistItem[];
  correlation: CorrelationData;
  records: RawRecord[];
}

export interface CRISPPhase {
  id: string;
  number: number;
  name: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PLANNED";
  summary: string;
  metrics: Record<string, string | number>;
}

export interface PredictionDetail {
  sample_id: number;
  actual: number;
  predicted: number;
  residual: number;
  abs_error: number;
  pct_error: number;
}

export interface ModelEvaluation {
  id: string;
  name: string;
  category: "Baseline" | "Embedded" | "Wrapper" | "Global Search";
  method: string;
  description: string;
  features: string[];
  num_features: number;
  cv_rmse: number;
  test_mae: number;
  test_rmse: number;
  test_r2: number;
  coefficients: Record<string, number>;
  intercept: number;
  predictions: PredictionDetail[];
  note?: string | null;
}

export interface ForwardStep {
  step: number;
  feature_added: string;
  selected_features: string[];
  num_features: number;
  cv_rmse: number;
  cv_r2: number;
}

export interface ExhaustiveSubset {
  features: string[];
  num_features: number;
  cv_rmse: number;
}

export interface FeatureCountCurveItem {
  algorithm: string;
  k: number;
  features: string[];
  num_features: number;
  cv_rmse: number;
  cv_r2: number;
  test_mae: number;
  test_rmse: number;
  test_r2: number;
  coefficients: Record<string, number>;
  intercept: number;
  training_ols_statistics?: TrainingOLSStatistics;
}

export interface TrainingOLSStatistics {
  r_squared: number;
  adjusted_r_squared: number;
  f_statistic: number | null;
  f_p_value: number | null;
  observations: number;
  coefficients: Array<{
    feature: string;
    estimate: number;
    std_error: number;
    t_statistic: number;
    p_value: number;
    ci_lower: number;
    ci_upper: number;
    vif: number | null;
    vif_note: string | null;
  }>;
}

export interface DashboardData {
  metadata: {
    project: string;
    title: string;
    generated_at: string;
    random_state: number;
    best_cv_model_id: string;
    best_cv_model_name: string;
  };
  dataset_summary: DatasetSummary;
  crispdm: CRISPPhase[];
  models: ModelEvaluation[];
  forward_progression: ForwardStep[];
  exhaustive_subsets: ExhaustiveSubset[];
  test_ground_truth: Array<{ sample_id: number; actual: number }>;
  feature_count_curves?: FeatureCountCurveItem[];
}

