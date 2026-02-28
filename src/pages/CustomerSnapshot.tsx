import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { KPICard } from "@/components/dashboard/KPICard";
import { TrendLineChart } from "@/components/dashboard/TrendLineChart";
import { FeatureBarChart } from "@/components/dashboard/FeatureBarChart";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  filterEventsByDateRange, filterEventsByProduct, filterEventsByCustomer,
  getCustomerMetrics, getFeatureUsage, getDailyMetrics
} from "@/lib/calculations";
import { Users, Zap, BarChart3, TrendingUp } from "lucide-react";

export default function CustomerSnapshot() {
  const { data, dateRange, productFilter, hasData } = useData();
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  const customerList = useMemo(() => {
    const ids = [...new Set(data.events.map(e => e.customer_id))];
    return ids.map(id => {
      const ev = data.events.find(e => e.customer_id === id);
      return { id, name: ev?.customer_name || id };
    });
  }, [data.events]);

  const custId = selectedCustomer || customerList[0]?.id || "";

  const metrics = useMemo(() => {
    if (!hasData || !custId) return null;
    let events = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
    events = filterEventsByProduct(events, productFilter);
    events = filterEventsByCustomer(events, custId);
    const m = getCustomerMetrics(events, data.customers, dateRange.from, dateRange.to);
    return m[0] || null;
  }, [data, dateRange, productFilter, custId, hasData]);

  const featureUsage = useMemo(() => {
    if (!custId) return [];
    let events = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
    events = filterEventsByProduct(events, productFilter);
    events = filterEventsByCustomer(events, custId);
    return getFeatureUsage(events);
  }, [data, dateRange, productFilter, custId]);

  const dailyData = useMemo(() => {
    if (!custId) return [];
    let events = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
    events = filterEventsByProduct(events, productFilter);
    events = filterEventsByCustomer(events, custId);
    return getDailyMetrics(events, metrics?.licensedUsers || 10);
  }, [data, dateRange, productFilter, custId, metrics]);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Upload event data to view customer snapshots.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Customer Snapshot</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Individual customer performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={custId} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customerList.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FilterBar />
        </div>
      </div>

      {metrics && (
        <>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{metrics.customer_name}</h2>
            <HealthBadge status={metrics.health} size="md" />
          </div>

          <div className="grid grid-cols-5 gap-4">
            <KPICard title="Active Users" value={metrics.activeUsers} icon={<Users className="w-4 h-4" />} />
            <KPICard title="Sessions" value={metrics.totalSessions} icon={<Zap className="w-4 h-4" />} />
            <KPICard title="DAU / WAU / MAU" value={`${metrics.dau} / ${metrics.wau} / ${metrics.mau}`} />
            <KPICard title="Adoption Score" value={metrics.adoptionScore} subtitle="/100" icon={<BarChart3 className="w-4 h-4" />} />
            <KPICard title="Momentum" value={`${metrics.momentum > 0 ? "+" : ""}${metrics.momentum}%`} trend={metrics.momentum} icon={<TrendingUp className="w-4 h-4" />} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card className="p-5 border bg-card">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Adoption Trend</h3>
              <TrendLineChart data={dailyData} />
            </Card>
            <Card className="p-5 border bg-card">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Feature Usage (Top 10)</h3>
              <FeatureBarChart data={featureUsage} />
            </Card>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { title: "Adoption Summary", desc: `Score: ${metrics.adoptionScore}/100, Health: ${metrics.health}` },
              { title: "Engagement Summary", desc: `${metrics.totalSessions} sessions across ${metrics.activeUsers} users` },
              { title: "Feature Summary", desc: `${featureUsage.length} features used, top: ${featureUsage[0]?.feature || "N/A"}` },
              { title: "Session Summary", desc: `DAU: ${metrics.dau}, WAU: ${metrics.wau}, MAU: ${metrics.mau}` },
            ].map(tile => (
              <Card key={tile.title} className="p-4 border bg-card">
                <h4 className="text-xs font-semibold text-card-foreground mb-1">{tile.title}</h4>
                <p className="text-xs text-muted-foreground">{tile.desc}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
