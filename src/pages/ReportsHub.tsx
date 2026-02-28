import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { CustomerTable } from "@/components/dashboard/CustomerTable";
import { TrendLineChart } from "@/components/dashboard/TrendLineChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  filterEventsByDateRange, filterEventsByProduct, getCustomerMetrics, getDailyMetrics
} from "@/lib/calculations";
import { Download, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ReportsHub() {
  const { data, dateRange, productFilter, hasData } = useData();
  const [view, setView] = useState("ranking");

  const metrics = useMemo(() => {
    if (!hasData) return [];
    let events = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
    events = filterEventsByProduct(events, productFilter);
    return getCustomerMetrics(events, data.customers, dateRange.from, dateRange.to)
      .sort((a, b) => b.adoptionScore - a.adoptionScore);
  }, [data, dateRange, productFilter, hasData]);

  const exportCSV = () => {
    const header = "Customer,Product,Tier,Active Users,Sessions,Adoption Score,Momentum,Health\n";
    const rows = metrics.map(m =>
      `"${m.customer_name}","${m.product}","${m.tier}",${m.activeUsers},${m.totalSessions},${m.adoptionScore},${m.momentum},${m.health}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pm-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const comparisonData = useMemo(() => {
    if (metrics.length === 0) return [];
    const top5 = metrics.slice(0, 5);
    return top5.map(m => {
      let events = filterEventsByDateRange(data.events, dateRange.from, dateRange.to);
      events = events.filter(e => e.customer_id === m.customer_id);
      return {
        name: m.customer_name,
        daily: getDailyMetrics(events, m.licensedUsers),
      };
    });
  }, [metrics, data, dateRange]);

  if (!hasData) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Upload data to generate reports.</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Cross-customer analysis and export</p>
        </div>
        <div className="flex items-center gap-3">
          <FilterBar />
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={exportCSV}>
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" /></TooltipTrigger><TooltipContent side="bottom" className="max-w-[240px] text-xs">Exports customer, product, tier, active users, sessions, adoption score, momentum, and health status</TooltipContent></Tooltip></TooltipProvider>
          </div>
        </div>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="ranking">Ranking Table</TabsTrigger>
          <TabsTrigger value="comparison">Comparison Chart</TabsTrigger>
        </TabsList>
        <TabsContent value="ranking" className="mt-4">
          <div className="flex items-center gap-1.5 mb-3">
            <h3 className="text-sm font-semibold text-foreground">Customer Ranking by Adoption Score</h3>
            <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[240px] text-xs">Customers ranked by adoption score. Score = Reach (40%) + Frequency (30%) + Depth (30%)</TooltipContent></Tooltip></TooltipProvider>
          </div>
          <CustomerTable customers={metrics} />
        </TabsContent>
        <TabsContent value="comparison" className="mt-4">
          <Card className="p-5 border bg-card">
            <div className="flex items-center gap-1.5 mb-4">
              <h3 className="text-sm font-semibold text-card-foreground">
                Top 5 Customers – Active Users Over Time
              </h3>
              <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" /></TooltipTrigger><TooltipContent side="top" className="max-w-[240px] text-xs">Daily active user trends for the top 5 customers by adoption score</TooltipContent></Tooltip></TooltipProvider>
            </div>
            {comparisonData.length > 0 && comparisonData[0].daily.length > 0 ? (
              <TrendLineChart
                data={comparisonData[0].daily}
                lines={[
                  { key: "activeUsers", color: "hsl(173, 58%, 39%)", label: comparisonData[0]?.name || "" },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Not enough data for comparison.</p>
            )}
            <div className="mt-4 flex gap-3 flex-wrap">
              {comparisonData.map((c, i) => {
                const colors = [
                  "hsl(173, 58%, 39%)", "hsl(220, 70%, 55%)", "hsl(262, 52%, 55%)",
                  "hsl(38, 92%, 50%)", "hsl(340, 65%, 55%)"
                ];
                return (
                  <span key={c.name} className="text-xs flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
                    {c.name}
                  </span>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
