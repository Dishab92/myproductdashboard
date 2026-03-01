import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import {
  getModuleLeaderboard, getSubFeatureLeaderboard, getClicksTrend,
  InteractionFilter,
} from "@/lib/insights-calculations";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LineChart, Line } from "recharts";
import { Layers, MousePointerClick, Users, Timer } from "lucide-react";

const COLORS = [
  "hsl(195, 100%, 50%)", "hsl(270, 100%, 65%)", "hsl(330, 100%, 60%)",
  "hsl(220, 80%, 60%)", "hsl(38, 100%, 55%)", "hsl(195, 100%, 60%)",
  "hsl(270, 100%, 72%)", "hsl(330, 100%, 68%)", "hsl(220, 80%, 68%)",
  "hsl(38, 100%, 62%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  backdropFilter: "blur(12px)",
  border: "1px solid hsla(var(--primary), 0.2)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--foreground))",
  boxShadow: "0 0 20px hsla(var(--primary), 0.1)",
};

export default function FeatureInsights() {
  const { data, hasData } = useData();
  const [customerFilter, setCustomerFilter] = useState("All");
  const [interactionFilter, setInteractionFilter] = useState<InteractionFilter>("all");

  const customers = useMemo(() => {
    const set = new Set(data.events.map(e => e.customer_name));
    return ["All", ...Array.from(set).sort()];
  }, [data.events]);

  const filtered = useMemo(() => {
    let events = data.events;
    if (customerFilter !== "All") events = events.filter(e => e.customer_name === customerFilter);
    return events;
  }, [data.events, customerFilter]);

  const modules = useMemo(() => getModuleLeaderboard(filtered, interactionFilter), [filtered, interactionFilter]);
  const subFeatures = useMemo(() => getSubFeatureLeaderboard(filtered, interactionFilter), [filtered, interactionFilter]);
  const trend = useMemo(() => getClicksTrend(filtered), [filtered]);

  const totalClicks = modules.reduce((s, m) => s + m.clicks, 0);
  const totalUsers = new Set(filtered.map(e => e.user_id)).size;
  const avgLatencyAll = (() => {
    const withLat = modules.filter(m => m.avgLatency !== null);
    if (withLat.length === 0) return null;
    return Math.round(withLat.reduce((s, m) => s + m.avgLatency!, 0) / withLat.length);
  })();

  if (!hasData) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-extrabold text-gradient-cyan">Feature Insights</h1>
        <Card className="p-12 mt-6 text-center">
          <p className="text-muted-foreground text-sm">Upload event data in Data Management to see feature analytics.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header + Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gradient-cyan">Feature Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Module &amp; sub-feature usage analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-44 glass-strong border-glow-cyan h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-glow-cyan">
              {customers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={interactionFilter} onValueChange={(v) => setInteractionFilter(v as InteractionFilter)}>
            <SelectTrigger className="w-36 glass-strong border-glow-cyan h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-glow-cyan">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="clicks">Clicks Only</SelectItem>
              <SelectItem value="page_views">Page Views Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <Layers className="w-3.5 h-3.5" />, label: "Total Modules", value: modules.length },
          { icon: <MousePointerClick className="w-3.5 h-3.5" />, label: "Total Clicks", value: totalClicks.toLocaleString() },
          { icon: <Users className="w-3.5 h-3.5" />, label: "Unique Users", value: totalUsers },
          { icon: <Timer className="w-3.5 h-3.5" />, label: "Avg Latency", value: avgLatencyAll !== null ? `${avgLatencyAll}ms` : "N/A" },
        ].map((kpi, i) => (
          <div key={kpi.label} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <div className="text-primary">{kpi.icon}</div> {kpi.label}
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{kpi.value}</p>
            </Card>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="subfeatures">Sub-features</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Top Modules Leaderboard</h3>
              <div className="overflow-auto max-h-96 border-glow-cyan rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Module</TableHead>
                      <TableHead className="text-xs text-right">Interactions</TableHead>
                      <TableHead className="text-xs text-right">Clicks</TableHead>
                      <TableHead className="text-xs text-right">Users</TableHead>
                      <TableHead className="text-xs text-right">Cases</TableHead>
                      <TableHead className="text-xs text-right">Latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((m, i) => (
                      <TableRow key={m.module} className="border-l-2 border-l-transparent hover:border-l-primary transition-all">
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{m.module}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{m.totalInteractions.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{m.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{m.uniqueUsers}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{m.uniqueCases}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{m.avgLatency !== null ? `${m.avgLatency}ms` : "–"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Top 10 Modules by Clicks</h3>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modules.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border), 0.6)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="module" type="category" width={120} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                      {modules.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Sub-features Tab */}
        <TabsContent value="subfeatures" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Top Sub-features Leaderboard</h3>
              <div className="overflow-auto max-h-96 border-glow-cyan rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Sub-feature</TableHead>
                      <TableHead className="text-xs">Module</TableHead>
                      <TableHead className="text-xs text-right">Clicks</TableHead>
                      <TableHead className="text-xs text-right">Users</TableHead>
                      <TableHead className="text-xs text-right">Cases</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subFeatures.slice(0, 30).map((sf, i) => (
                      <TableRow key={`${sf.module}-${sf.subFeature}`} className="border-l-2 border-l-transparent hover:border-l-primary transition-all">
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{sf.subFeature}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{sf.module}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{sf.clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{sf.uniqueUsers}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{sf.uniqueCases}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-card-foreground mb-3">Top 10 Sub-features by Clicks</h3>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subFeatures.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border), 0.6)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="subFeature" type="category" width={140} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                      {subFeatures.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Daily Interaction Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border), 0.6)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Clicks" />
                <Line type="monotone" dataKey="pageViews" stroke="hsl(270, 100%, 65%)" strokeWidth={2} dot={false} name="Page Views" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
