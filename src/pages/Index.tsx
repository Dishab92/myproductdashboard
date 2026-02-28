import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KPICard } from "@/components/dashboard/KPICard";
import { CustomerTable } from "@/components/dashboard/CustomerTable";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import {
  filterEventsByDateRange, filterEventsByProduct, getCustomerMetrics, getPortfolioKPIs
} from "@/lib/calculations";
import { Users, Activity, Target, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomerMetrics } from "@/lib/types";

export default function PortfolioOverview() {
  const { data, dateRange, productFilter, releaseFilter, hasData } = useData();
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    if (!hasData) return [];
    let events = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
    events = filterEventsByProduct(events, productFilter);
    let m = getCustomerMetrics(events, data.customers, dateRange.from, dateRange.to);
    if (releaseFilter !== "All") m = m.filter(c => c.release === releaseFilter);
    return m;
  }, [data, dateRange, productFilter, releaseFilter, hasData]);

  const kpis = useMemo(() => getPortfolioKPIs(metrics), [metrics]);

  const topGrowing = useMemo(() =>
    [...metrics].sort((a, b) => b.momentum - a.momentum).slice(0, 5),
    [metrics]
  );

  const declining = useMemo(() =>
    [...metrics].filter(m => m.momentum < 0).sort((a, b) => a.momentum - b.momentum).slice(0, 5),
    [metrics]
  );

  const alerts = useMemo(() => {
    const list: { type: string; message: string; customer: string; severity: "red" | "amber" }[] = [];
    for (const m of metrics) {
      const now = new Date();
      if (m.lastActivity) {
        const days = (now.getTime() - m.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        if (days > 14) {
          list.push({ type: "inactive", message: `No activity for ${Math.floor(days)} days`, customer: m.customer_name, severity: "red" });
        }
      }
      if (m.momentum < -30) {
        list.push({ type: "drop", message: `Adoption dropped ${m.momentum}% WoW`, customer: m.customer_name, severity: "amber" });
      }
    }
    return list;
  }, [metrics]);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="p-4 rounded-2xl" style={{ background: 'hsla(195, 100%, 50%, 0.08)' }}>
          <Upload className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Upload events.csv to begin</h2>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          Go to Data Management to upload your event data and start analyzing your product portfolio.
        </p>
        <Button onClick={() => navigate("/data")}
          style={{ background: 'linear-gradient(135deg, hsl(195 100% 50%), hsl(220 80% 55%))' }}>
          Go to Data Management
        </Button>
      </div>
    );
  }

  const handleSelectCustomer = (customerId: string) => {
    navigate(`/drilldown?customer=${customerId}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gradient-cyan">Portfolio Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cross-product health at a glance</p>
        </div>
        <FilterBar />
      </div>

      {/* KPI Cards with staggered animation */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { title: "Total Customers", value: kpis.totalCustomers, icon: <Users className="w-4 h-4" />, tooltip: "Number of distinct customers with events in the selected date range and filters" },
          { title: "Active Users", value: kpis.totalActiveUsers, icon: <Activity className="w-4 h-4" />, tooltip: "Distinct users who triggered at least one event in the selected period" },
          { title: "Avg Adoption Score", value: kpis.avgAdoptionScore, subtitle: "out of 100", icon: <Target className="w-4 h-4" />, tooltip: "Weighted average: Reach (40%) + Frequency (30%) + Depth (30%), scale 0–100" },
          { title: "Customers at Risk", value: kpis.customersAtRisk, icon: <AlertTriangle className="w-4 h-4" />, tooltip: "Customers with Red health: adoption score below 40 or no activity for 14+ days" },
        ].map((kpi, i) => (
          <div key={kpi.title} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
            <KPICard {...kpi} />
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="p-4 animate-slide-up" style={{ animationDelay: '0.4s', opacity: 0, borderLeft: '2px solid hsl(var(--health-amber))' }}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-health-amber" />
            Alerts ({alerts.length})
          </h3>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1.5 px-3 rounded" style={{ background: 'hsla(220, 20%, 14%, 0.5)' }}>
                <HealthBadge status={a.severity} />
                <span className="font-medium text-foreground">{a.customer}</span>
                <span className="text-muted-foreground">{a.message}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section header with accent line */}
      <div className="flex items-center gap-3">
        <div className="h-[2px] w-8 rounded" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--neon-violet)))' }} />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Performance</h2>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-2 gap-6">
        <CustomerTable title="🚀 Top Growing Customers" customers={topGrowing} onSelect={handleSelectCustomer} />
        <CustomerTable title="⚠️ Declining Customers" customers={declining} onSelect={handleSelectCustomer} />
      </div>

      <CustomerTable title="All Customers" customers={metrics} onSelect={handleSelectCustomer} />
    </div>
  );
}
