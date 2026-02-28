import { useState, useMemo } from "react";
import { useData } from "@/context/DataContext";
import { parseAgentAdoptionCSV } from "@/lib/csv-parser";
import { UploadPanel } from "@/components/dashboard/UploadPanel";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, BarChart3, TrendingUp, Grid3X3 } from "lucide-react";

export default function AgentAdoption() {
  const { data, setAgentAdoption } = useData();
  const [customerInput, setCustomerInput] = useState("Accela");
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState("All");

  const customers = useMemo(() => {
    const set = new Set(data.agentAdoption.map(r => r.customerName));
    return ["All", ...Array.from(set)];
  }, [data.agentAdoption]);

  const filtered = useMemo(() => {
    if (selectedCustomer === "All") return data.agentAdoption;
    return data.agentAdoption.filter(r => r.customerName === selectedCustomer);
  }, [data.agentAdoption, selectedCustomer]);

  // Agent leaderboard
  const agentLeaderboard = useMemo(() => {
    const map = new Map<string, { total: number; features: Set<string> }>();
    for (const r of filtered) {
      const entry = map.get(r.agentName) || { total: 0, features: new Set() };
      entry.total += r.usageCount;
      entry.features.add(r.featureUsed);
      map.set(r.agentName, entry);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, totalUsage: v.total, featuresUsed: v.features.size }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
  }, [filtered]);

  // Feature breakdown
  const featureBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.featureUsed, (map.get(r.featureUsed) || 0) + r.usageCount);
    }
    return Array.from(map.entries())
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      const key = r.date.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + r.usageCount);
    }
    return Array.from(map.entries())
      .map(([date, usage]) => ({ date, usage }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  // Heatmap data: agents × features
  const heatmapData = useMemo(() => {
    const features = [...new Set(filtered.map(r => r.featureUsed))];
    const agents = [...new Set(filtered.map(r => r.agentName))];
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(`${r.agentName}|${r.featureUsed}`, (map.get(`${r.agentName}|${r.featureUsed}`) || 0) + r.usageCount);
    }
    return { features, agents, map };
  }, [filtered]);

  const handleUpload = (text: string) => {
    const name = customerInput.trim() || "Unknown";
    const result = parseAgentAdoptionCSV(text, name);
    if (result.errors.length > 0 && result.records.length === 0) {
      setUploadResult({ success: false, message: result.errors.join("; ") });
      return;
    }
    setAgentAdoption(result.records);
    setUploadResult({
      success: true,
      message: `${result.records.length} records loaded for ${name}.${result.errors.length > 0 ? " " + result.errors.join("; ") : ""}`,
    });
    if (selectedCustomer === "All") setSelectedCustomer(name);
  };

  const maxHeatVal = useMemo(() => {
    let max = 0;
    heatmapData.map.forEach(v => { if (v > max) max = v; });
    return max || 1;
  }, [heatmapData]);

  const hasRecords = filtered.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Agent Adoption</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Agent-level feature usage analysis</p>
        </div>
        {customers.length > 1 && (
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Upload */}
      <Card className="p-5 border bg-card">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground">Customer Name</label>
            <Input
              value={customerInput}
              onChange={e => setCustomerInput(e.target.value)}
              placeholder="e.g. Accela"
              className="w-48 h-8 text-sm"
            />
          </div>
          <UploadPanel
            title="Agent Adoption CSV"
            description="Columns: Date (DD-MM-YYYY), Agent Name, Feature Used, Usage Count"
            onUpload={handleUpload}
            result={uploadResult}
          />
        </div>
      </Card>

      {hasRecords && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Users className="w-3.5 h-3.5" /> Total Agents
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{agentLeaderboard.length}</p>
            </Card>
            <Card className="p-4 border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BarChart3 className="w-3.5 h-3.5" /> Total Usage
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {filtered.reduce((s, r) => s + r.usageCount, 0).toLocaleString()}
              </p>
            </Card>
            <Card className="p-4 border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5" /> Features Tracked
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{featureBreakdown.length}</p>
            </Card>
          </div>

          {/* Agent Leaderboard + Feature Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5 border bg-card">
              <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Agent Leaderboard
              </h3>
              <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Agent</TableHead>
                      <TableHead className="text-xs text-right">Usage</TableHead>
                      <TableHead className="text-xs text-right">Features</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentLeaderboard.map((a, i) => (
                      <TableRow key={a.name}>
                        <TableCell className="text-sm text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{a.name}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{a.totalUsage}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{a.featuresUsed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="p-5 border bg-card">
              <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Feature Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={featureBreakdown} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="feature" type="category" width={120} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Daily Trend */}
          <Card className="p-5 border bg-card">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Usage Trend Over Time
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyTrend} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="usage" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Heatmap */}
          <Card className="p-5 border bg-card">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-primary" /> Agent × Feature Matrix
            </h3>
            <div className="overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs sticky left-0 bg-muted/50 z-10">Agent</TableHead>
                    {heatmapData.features.map(f => (
                      <TableHead key={f} className="text-xs text-center whitespace-nowrap">{f}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmapData.agents.map(agent => (
                    <TableRow key={agent}>
                      <TableCell className="text-sm font-medium sticky left-0 bg-card z-10">{agent}</TableCell>
                      {heatmapData.features.map(f => {
                        const val = heatmapData.map.get(`${agent}|${f}`) || 0;
                        const intensity = val / maxHeatVal;
                        return (
                          <TableCell
                            key={f}
                            className="text-center text-xs tabular-nums"
                            style={{
                              backgroundColor: val > 0 ? `hsla(var(--primary), ${0.1 + intensity * 0.5})` : undefined,
                            }}
                          >
                            {val || "–"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {!hasRecords && (
        <Card className="p-12 border bg-card text-center">
          <p className="text-muted-foreground text-sm">Upload an Agent Adoption CSV above to see analytics.</p>
        </Card>
      )}
    </div>
  );
}