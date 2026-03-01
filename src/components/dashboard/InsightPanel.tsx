import { useState } from "react";
import { AlertTriangle, TrendingUp, Lightbulb, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSnapshot } from "@/context/SnapshotContext";
import type { Insight } from "@/lib/insight-engine";

const PRIORITY_CONFIG = {
  high: { icon: AlertTriangle, color: "text-health-red", label: "Risk" },
  growth: { icon: TrendingUp, color: "text-health-green", label: "Growth" },
  optimization: { icon: Lightbulb, color: "text-health-amber", label: "Optimization" },
} as const;

const CONFIDENCE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  High: "default",
  Medium: "secondary",
  Low: "outline",
};

interface InsightPanelProps {
  insights: Insight[];
}

export function InsightPanel({ insights }: InsightPanelProps) {
  const { isSnapshotMode } = useSnapshot();

  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-[2px] w-8 rounded" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' }} />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Product Intelligence</h2>
      </div>
      <div className="grid gap-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} forceOpen={isSnapshotMode} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ insight, forceOpen }: { insight: Insight; forceOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen || open;
  const config = PRIORITY_CONFIG[insight.priority];
  const Icon = config.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setOpen}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{insight.title}</span>
              <Badge variant={CONFIDENCE_VARIANT[insight.confidence]} className="text-[10px] px-1.5 py-0">
                {insight.confidence}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{insight.explanation}</p>
          </div>
          {!forceOpen && (
            <CollapsibleTrigger asChild>
              <button className="shrink-0 p-1 rounded hover:bg-muted/50 transition-colors">
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </CollapsibleTrigger>
          )}
        </div>
        <CollapsibleContent>
          <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
            {insight.details.map((d, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-mono text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
