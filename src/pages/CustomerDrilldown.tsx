import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { HealthBadge } from "@/components/dashboard/HealthBadge";
import { TrendLineChart } from "@/components/dashboard/TrendLineChart";
import { FeatureBarChart } from "@/components/dashboard/FeatureBarChart";
import { ScoreHistogram } from "@/components/dashboard/ScoreHistogram";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  filterEventsByDateRange, filterEventsByCustomer, getCustomerMetrics,
  getFeatureUsage, getDailyMetrics
} from "@/lib/calculations";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CustomerDrilldown() {
  const { data, dateRange, hasData } = useData();
  const [searchParams] = useSearchParams();
  const paramCustomer = searchParams.get("customer") || "";
  const [selectedCustomer, setSelectedCustomer] = useState(paramCustomer);

  const customerList = useMemo(() => {
    const ids = [...new Set(data.events.map(e => e.customer_id))];
    return ids.map(id => ({
      id,
      name: data.events.find(e => e.customer_id === id)?.customer_name || id,
    }));
  }, [data.events]);

  const custId = selectedCustomer || customerList[0]?.id || "";

  const metrics = useMemo(() => {
    if (!hasData || !custId) return null;
    const events = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
    const custEvents = filterEventsByCustomer(events, custId);
    const m = getCustomerMetrics(custEvents, data.customers, dateRange.from, dateRange.to);
    return m[0] || null;
  }, [data, dateRange, custId, hasData]);

  const featureUsage = useMemo(() => {
    const events = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
    return getFeatureUsage(filterEventsByCustomer(events, custId));
  }, [data, dateRange, custId]);

  const dailyData = useMemo(() => {
    const events = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
    return getDailyMetrics(filterEventsByCustomer(events, custId), metrics?.licensedUsers || 10);
  }, [data, dateRange, custId, metrics]);

  const custScores = useMemo(() =>
    data.scores.filter(s => s.customer_id === custId),
    [data.scores, custId]
  );

  const custProducts = useMemo(() => {
    const events = filterEventsByCustomer(data.events, custId);
    return [...new Set(events.map(e => e.product))];
  }, [data.events, custId]);

  if (!hasData) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Upload data first.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Customer Drilldown</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deep dive into customer adoption</p>
        </div>
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
      </div>

      {metrics && (
        <>
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground">{metrics.customer_name}</h2>
            <HealthBadge status={metrics.health} size="md" />
            <span className="text-xs text-muted-foreground">
              Products: {custProducts.join(", ")}
            </span>
            {data.lastUpload && (
              <span className="text-xs text-muted-foreground ml-auto">
                Last upload: {data.lastUpload.toLocaleString()}
              </span>
            )}
          </div>

          {/* A) Adoption Trends */}
          <Card className="p-5 border bg-card">
            <div className="flex items-center gap-1.5 mb-4">
              <h3 className="text-sm font-semibold text-card-foreground">Adoption Trends</h3>
              <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Daily adoption score trend over the selected date range</TooltipContent></Tooltip></TooltipProvider>
            </div>
            <TrendLineChart data={dailyData} />
          </Card>

          {/* B) Engagement Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Reach", value: metrics.reach, desc: "Active / Licensed users", tip: "Active users divided by licensed users (40% of adoption score)" },
              { label: "Frequency", value: metrics.frequency, desc: "Sessions per active user", tip: "Sessions per active user, normalized (30% of adoption score)" },
              { label: "Depth", value: metrics.depth, desc: "Distinct core actions used", tip: "Distinct core actions used, normalized (30% of adoption score)" },
            ].map(item => (
              <Card key={item.label} className="p-5 border bg-card">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">{item.tip}</TooltipContent></Tooltip></TooltipProvider>
                </div>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-3xl font-bold text-card-foreground">{item.value}</span>
                  <span className="text-xs text-muted-foreground pb-1">/100</span>
                </div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{item.desc}</p>
              </Card>
            ))}
          </div>

          {/* C) Feature Usage Table */}
          <Card className="p-5 border bg-card">
            <div className="flex items-center gap-1.5 mb-4">
              <h3 className="text-sm font-semibold text-card-foreground">Feature Usage</h3>
              <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Breakdown of feature clicks, unique users, and share of total usage</TooltipContent></Tooltip></TooltipProvider>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <FeatureBarChart data={featureUsage} />
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">Feature</TableHead>
                      <TableHead className="text-xs text-right">Clicks</TableHead>
                      <TableHead className="text-xs text-right">Users</TableHead>
                      <TableHead className="text-xs text-right">% Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureUsage.map(f => (
                      <TableRow key={f.feature}>
                        <TableCell className="text-sm font-medium">{f.feature}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{f.totalClicks.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{f.uniqueUsers}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{f.percentOfTotal}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>

          {/* D) Session Analysis */}
          <Card className="p-5 border bg-card">
            <div className="flex items-center gap-1.5 mb-4">
              <h3 className="text-sm font-semibold text-card-foreground">Session Analysis</h3>
              <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">Session volume and per-user distribution for the selected period</TooltipContent></Tooltip></TooltipProvider>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{metrics.totalSessions}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Sessions</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">
                  {metrics.activeUsers > 0 ? (metrics.totalSessions / metrics.activeUsers).toFixed(1) : 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Sessions per User</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{metrics.activeUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique Users</p>
              </div>
            </div>
          </Card>

          {/* E) Case QA Scores */}
          {custProducts.includes("Case QA") && (
            <Card className="p-5 border bg-card">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Case QA Score Distribution</h3>
              {custScores.length > 0 ? (
                <ScoreHistogram scores={custScores} />
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Info className="w-4 h-4" />
                  Score distribution not available. Upload scores.csv to enable.
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
