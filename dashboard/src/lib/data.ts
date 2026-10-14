import { DashboardData } from "@/types/ml";
import dashboardDataRaw from "@/data/dashboard_data.json";

export function getDashboardData(): DashboardData {
  return dashboardDataRaw as unknown as DashboardData;
}
