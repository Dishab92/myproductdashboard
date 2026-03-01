import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import {
  computeEngagedTime, getAgentEngagedTime, getModuleEngagedTime,
  formatDuration,
} from "@/lib/insights-calculations";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Timer, AlertTriangle, Users } from "lucide-react";

export default function CaseTimeInsights() {
  const { data, hasData } = useData();
  const [customerFilter, setCustomerFilter] = useState("All");

  const customers = useMemo(() => {
    const set = new Set(data.events.map(e => e.customer_name));
    return ["All", ...Array.from(set).sort()];
  }, [data.events]);

  const filtered = useMemo(() => {
    if (customerFilter === "All") return data.events;
    return data.events.filter(e => e.customer_name === customerFilter);
  }, [data.events, customerFilter]);

  const hasCaseData = filtered.some(e => !!e.case_id);

  const caseTimes = useMemo(() => computeEngagedTime(filtered), [filtered]);
  const agentTimes = useMemo(() => getAgentEngagedTime(filtered), [filtered]);
  const moduleTimes = useMemo(() => getModuleEngagedTime(filtered), [filtered]);

  // KPIs
  const avgMs = caseTimes.length > 0 ? Math.round(caseTimes.reduce((s, c) => s + c.totalEngagedMs, 0) / caseTimes.length) : 0;
  const medianMs = (() => {
    if (caseTimes.length === 0) return 0;
    const sorted = [...caseTimes].sort((a, b) => a.totalEngagedMs - b.totalEngagedMs);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid].totalEngagedMs : Math.round((sorted[mid - 1].totalEngagedMs + sorted[mid].totalEngagedMs) / 2);
  })();
  const totalMs = caseTimes.reduce((s, c) => s + c.totalEngagedMs, 0);
  const highTime = caseTimes.filter(c => c.totalEngagedMs > 30 * 60 * 1000).length;

  if (!hasData) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-extrabold text-gradient-cyan">Estimated Time on Case</h1>
        <Card className="p-12 mt-6 text-center">
          <p className="text-muted-foreground text-sm">Upload event data in Data Management to see case time analytics.</p>
        </Card>
      </div>
    );
  }

  if (!hasCaseData) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-extrabold text-gradient-cyan">Estimated Time on Case</h1>
        <Card className="p-12 mt-6 text-center border-destructive/30">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-destructive" />
          <p className="text-muted-foreground text-sm">Case IDs not available in uploaded data. Time-on-case analysis requires the case_number field.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gradient-cyan">Estimated Time on Case</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estimated engaged time (based on interaction bursts with 10-min gap threshold)
          </p>
        </div>
        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-44 glass-strong border-glow-cyan h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-strong border-glow-cyan">
            {customers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: <Clock className="w-3.5 h-3.5" />, label: "Avg Engaged / Case", value: formatDuration(avgMs) },
          { icon: <Timer className="w-3.5 h-3.5" />, label: "Median Engaged", value: formatDuration(medianMs) },
          { icon: <Clock className="w-3.5 h-3.5" />, label: "Total Engaged Time", value: formatDuration(totalMs) },
          { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "High Time (>30m)", value: highTime },
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

      {/* Case Leaderboard */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Case Leaderboard</h3>
        <div className="overflow-auto max-h-[400px] border-glow-cyan rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Case ID</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs text-right">Engaged Time</TableHead>
                <TableHead className="text-xs text-right">Bursts</TableHead>
                <TableHead className="text-xs text-right">Agents</TableHead>
                <TableHead className="text-xs text-right">Interactions</TableHead>
                <TableHead className="text-xs">Top Module</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caseTimes.slice(0, 50).map(c => (
                <TableRow key={c.caseId} className="border-l-2 border-l-transparent hover:border-l-primary transition-all">
                  <TableCell className="text-sm font-mono">{c.caseId}</TableCell>
                  <TableCell className="text-sm">{c.customerName}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums font-semibold">{formatDuration(c.totalEngagedMs)}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{c.burstCount}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{c.uniqueAgents}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{c.totalInteractions}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.topModule}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Agent + Module Engaged Time */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Agent Engaged Time
          </h3>
          <div className="overflow-auto max-h-80 border-glow-cyan rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Agent</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs text-right">Avg/Case</TableHead>
                  <TableHead className="text-xs text-right">Cases</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentTimes.map(a => (
                  <TableRow key={a.userId} className="border-l-2 border-l-transparent hover:border-l-primary transition-all">
                    <TableCell className="text-sm font-medium">{a.userId}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{formatDuration(a.totalEngagedMs)}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{formatDuration(a.avgPerCase)}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{a.casesTouched}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Module Engaged Time</h3>
          <div className="overflow-auto max-h-80 border-glow-cyan rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Module</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs text-right">Avg/Case</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moduleTimes.map(m => (
                  <TableRow key={m.module} className="border-l-2 border-l-transparent hover:border-l-primary transition-all">
                    <TableCell className="text-sm font-medium">{m.module}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{formatDuration(m.totalEngagedMs)}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums">{formatDuration(m.avgPerCase)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
