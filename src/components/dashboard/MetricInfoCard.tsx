import { Info } from "lucide-react";
import { getMetricDefinition } from "@/lib/metric-definitions";
import { useSnapshot } from "@/context/SnapshotContext";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface MetricInfoCardProps {
  metricId: string;
  className?: string;
}

function DefinitionPanel({ metricId }: { metricId: string }) {
  const def = getMetricDefinition(metricId);
  if (!def) return null;

  return (
    <div className="space-y-2 text-xs">
      <p className="font-semibold text-foreground">{def.name}</p>
      <p className="text-muted-foreground">{def.definition}</p>
      {def.formula && (
        <div>
          <span className="font-medium text-primary">Formula: </span>
          <span className="text-muted-foreground whitespace-pre-line">{def.formula}</span>
        </div>
      )}
      <div>
        <span className="font-medium text-primary">Interpretation: </span>
        <span className="text-muted-foreground">{def.interpretation}</span>
      </div>
      {def.edgeCases && (
        <div>
          <span className="font-medium text-primary">Edge cases: </span>
          <span className="text-muted-foreground">{def.edgeCases}</span>
        </div>
      )}
      <p className="text-muted-foreground/60 italic">Source: {def.source}</p>
    </div>
  );
}

export function MetricInfoCard({ metricId, className }: MetricInfoCardProps) {
  const { isSnapshotMode } = useSnapshot();
  const def = getMetricDefinition(metricId);
  if (!def) return null;

  // Pinned mode in snapshot
  if (isSnapshotMode) {
    return (
      <div className={`mt-3 p-3 rounded-lg glass border-glow-cyan w-full overflow-visible break-words ${className || ""}`}>
        <DefinitionPanel metricId={metricId} />
      </div>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button className="inline-flex shrink-0 focus:outline-none focus:ring-1 focus:ring-primary rounded">
          <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors cursor-help" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        className="w-72 glass-strong border-glow-cyan p-4"
        sideOffset={8}
      >
        <DefinitionPanel metricId={metricId} />
      </HoverCardContent>
    </HoverCard>
  );
}
