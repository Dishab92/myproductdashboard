import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import {
  getAgentLeaderboard, AgentLeaderboardEntry,
  getAgentEngagedTime, formatDuration, getModuleLeaderboard,
} from "@/lib/insights-calculations";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, Award, MousePointerClick, Briefcase, Info } from "lucide-react";

const COLORS = [
  "hsl(195, 100%, 50%)", "hsl(270, 100%, 65%)", "hsl(330, 100%, 60%)",
  "hsl(220, 80%, 60%)", "hsl(38, 100%, 55%)",
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

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "hsl(var(--chart-2))" : score >= 40 ? "hsl(38, 100%, 55%)" : "hsl(0, 80%, 55%)";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

export default function AgentInsights() {
  const { data, hasData } = useData();
  const [customerFilter, setCustomerFilter] = useState("All");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const customers = useMemo(() => {
    const set = new Set(data.events.map(e => e.customer_name));
    return ["All", ...Array.from(set).sort()];
  }, [data.events]);

  const filtered = useMemo(() => {
    if (customerFilter === "All") return data.events;
    return data.events.filter(e => e.customer_name === customerFilter);
  }, [data.events, customerFilter]);

  const agents = useMemo(() => getAgentLeaderboard(filtered), [filtered]);
  const agentEngaged = useMemo(() => getAgentEngagedTime(filtered), [filtered]);

  const avgScore = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.usageScore, 0) / agents.length) : 0;
  const totalClicks = agents.reduce((s, a) => s + a.clicks, 0);
  const totalCases = new Set(filtered.filter(e => e.case_id).map(e => e.case_id)).size;

  // Agent drilldown data
  const agentDrilldown = useMemo(() => {
    if (!selectedAgent) return null;
    const agentEvents = filtered.filter(e => e.user_id === selectedAgent);
    const modules = getModuleLeaderboard(agentEvents);
    const engaged = agentEngaged.find(a => a.userId === selectedAgent);
    // Top cases
    const caseMap = new Map<string, number>();
    for (const e of agentEvents) {
      if (e.case_id) caseMap.set(e.case_id, (caseMap.get(e.case_id) || 0) + 1);
    }
    const topCases = Array.from(caseMap.entries())
      .map(([caseId, count]) => ({ caseId, interactions: count }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 10);
    return { modules, engaged, topCases };
  }, [selectedAgent, filtered, agentEngaged]);

  if (!hasData) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-extrabold text-gradient-cyan">Agent Insights</h1>
        <Card className="p-12 mt-6 text-center">
          <p className="text-muted-foreground text-sm">Upload event data in Data Management to see agent analytics.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gradient-cyan">Agent Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Agent usage scoring &amp; leaderboard</p>
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
          { icon: <Users className="w-3.5 h-3.5" />, label: "Total Agents", value: agents.length },
          { icon: <Award className="w-3.5 h-3.5" />, label: "Avg Usage Score", value: avgScore },
          { icon: <MousePointerClick className="w-3.5 h-3.5" />, label: "Total Clicks", value: totalClicks.toLocaleString() },
          { icon: <Briefcase className="w-3.5 h-3.5" />, label: "Cases Touched", value: totalCases },
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

      {/* Agent Leaderboard */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-card-foreground">Agent Leaderboard</h3>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-xs">
              <p className="font-semibold mb-1">Usage Score (0-100)</p>
              <p>40% clicks · 30% modules breadth · 20% sub-feature depth · 10% cases touched</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="overflow-auto max-h-[500px] border-glow-cyan rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs w-10">#</TableHead>
                <TableHead className="text-xs">Agent</TableHead>
                <TableHead className="text-xs">Score</TableHead>
                <TableHead className="text-xs text-right">Clicks</TableHead>
                <TableHead className="text-xs text-right">Modules</TableHead>
                <TableHead className="text-xs text-right">Sub-feat.</TableHead>
                <TableHead className="text-xs text-right">Cases</TableHead>
                <TableHead className="text-xs">Top Module</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((a, i) => (
                <TableRow
                  key={a.userId}
                  className={`cursor-pointer border-l-2 transition-all ${selectedAgent === a.userId ? "border-l-primary bg-primary/5" : "border-l-transparent hover:border-l-primary"}`}
                  onClick={() => setSelectedAgent(selectedAgent === a.userId ? null : a.userId)}
                >
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-sm font-medium">{a.userName}</TableCell>
                  <TableCell><ScoreBar score={a.usageScore} /></TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{a.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{a.modulesUsed}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{a.subFeaturesUsed}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{a.casesTouched}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.mostUsedModule}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Agent Drilldown */}
      {agentDrilldown && selectedAgent && (
        <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ opacity: 0 }}>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">
              Module Breakdown – {selectedAgent}
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={agentDrilldown.modules.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--border), 0.6)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="module" type="category" width={120} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <RTooltip contentStyle={tooltipStyle} />
                <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                  {agentDrilldown.modules.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {agentDrilldown.engaged && (
              <p className="text-xs text-muted-foreground mt-2">
                Total Engaged Time: <span className="font-semibold text-foreground">{formatDuration(agentDrilldown.engaged.totalEngagedMs)}</span>
                {" · "}Avg/Case: <span className="font-semibold text-foreground">{formatDuration(agentDrilldown.engaged.avgPerCase)}</span>
              </p>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">Top Cases Touched</h3>
            <div className="overflow-auto max-h-72 border-glow-cyan rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Case ID</TableHead>
                    <TableHead className="text-xs text-right">Interactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentDrilldown.topCases.map(c => (
                    <TableRow key={c.caseId}>
                      <TableCell className="text-sm font-mono">{c.caseId}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{c.interactions}</TableCell>
                    </TableRow>
                  ))}
                  {agentDrilldown.topCases.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground">No case data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
