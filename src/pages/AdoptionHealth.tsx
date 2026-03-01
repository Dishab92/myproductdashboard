import { useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useSnapshot } from "@/context/SnapshotContext";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KPICard } from "@/components/dashboard/KPICard";
import { MetricInfoCard } from "@/components/dashboard/MetricInfoCard";
import { CohortHeatmap } from "@/components/dashboard/CohortHeatmap";
import { RetentionChart } from "@/components/dashboard/RetentionChart";
import { RiskLeaderboard } from "@/components/dashboard/RiskLeaderboard";
import { getCustomerMetrics, filterEventsByDateRange, filterEventsByProduct } from "@/lib/calculations";
import { computeCohortData, computeRiskAssessments } from "@/lib/risk-calculations";
import { AlertTriangle, TrendingDown, BarChart3 } from "lucide-react";

export default function AdoptionHealth() {
  const { data, dateRange, productFilter } = useData();
  const { isSnapshotMode } = useSnapshot();

  const filtered = useMemo(() => {
    let evts = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
    evts = filterEventsByProduct(evts, productFilter);
    return evts;
  }, [data.events, dateRange, productFilter]);

  const customerMetrics = useMemo(
    () => getCustomerMetrics(filtered, data.customers, dateRange.from, dateRange.to),
    [filtered, data.customers, dateRange]
  );

  const cohortData = useMemo(
    () => computeCohortData(filtered, data.customers, dateRange),
    [filtered, data.customers, dateRange]
  );

  const riskAssessments = useMemo(
    () => computeRiskAssessments(data.events, data.customers, customerMetrics, dateRange),
    [data.events, data.customers, customerMetrics, dateRange]
  );

  const highRisk = riskAssessments.filter(a => a.riskLevel === "High").length;
  const mediumRisk = riskAssessments.filter(a => a.riskLevel === "Medium").length;
  const avgRiskScore = riskAssessments.length > 0
    ? Math.round(riskAssessments.reduce((s, a) => s + a.riskScore, 0) / riskAssessments.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Adoption Health</h1>
        <p className="text-sm text-muted-foreground">Cohort analysis and risk detection</p>
      </div>

      <FilterBar />

      {/* Section A: Cohort Analysis */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Cohort Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Heatmap */}
          <div className="lg:col-span-3 glass-strong rounded-lg p-4 border-glow-cyan">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Adoption by Cohort</h3>
              <MetricInfoCard metricId="cohort_adoption" />
            </div>
            <CohortHeatmap data={cohortData} />
          </div>
          {/* Retention Curve */}
          <div className="lg:col-span-2 glass-strong rounded-lg p-4 border-glow-cyan">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Retention Curve</h3>
              <MetricInfoCard metricId="retention_rate" />
            </div>
            <RetentionChart data={cohortData} />
          </div>
        </div>
      </div>

      {/* Section B: Risk Engine */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Risk Engine</h2>

        {/* Risk KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <KPICard
            title="High Risk"
            value={highRisk}
            icon={<AlertTriangle className="w-5 h-5 text-health-red" />}
            metricId="risk_score"
          />
          <KPICard
            title="Medium Risk"
            value={mediumRisk}
            icon={<TrendingDown className="w-5 h-5 text-health-amber" />}
          />
          <KPICard
            title="Avg Risk Score"
            value={avgRiskScore}
            icon={<BarChart3 className="w-5 h-5 text-primary" />}
            metricId="risk_score"
          />
        </div>

        {/* Risk Leaderboard */}
        <div className="glass-strong rounded-lg border-glow-cyan overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Risk Leaderboard</h3>
          </div>
          <RiskLeaderboard assessments={riskAssessments} />
        </div>
      </div>
    </div>
  );
}
