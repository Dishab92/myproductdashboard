import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AH_TARGET_BUCKETS, STATUS_COLORS, FEATURE_SOURCE_COLORS,
  computeWeightedScore, type ScoringWeights,
} from "@/lib/agent-helper-constants";
import { WeightScoreBadge } from "./WeightScoreBadge";
import type { RoadmapItem } from "./RoadmapCard";

const PRIORITY_COLORS: Record<string, string> = {
  P0: "bg-red-500/20 text-red-300 border-red-500/30",
  P1: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  P2: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  P3: "bg-muted text-muted-foreground border-border",
};

interface AgentHelperTimelineViewProps {
  items: RoadmapItem[];
  weights: ScoringWeights;
  onEdit: (item: RoadmapItem) => void;
  customerSafe: boolean;
  isAdmin: boolean;
}

export function AgentHelperTimelineView({ items, weights, onEdit, customerSafe, isAdmin }: AgentHelperTimelineViewProps) {
  const scored = items.map((item) => ({
    ...item,
    weightedScore: computeWeightedScore(item as any, weights),
  }));

  const bucketGroups = AH_TARGET_BUCKETS.map((bucket) => ({
    bucket,
    items: scored.filter((i) => (i as any).target_bucket === bucket),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {bucketGroups.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No items found</p>
      )}
      {bucketGroups.map(({ bucket, items: bucketItems }) => (
        <div key={bucket}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-semibold text-foreground">{bucket}</h3>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {bucketItems.length} item{bucketItems.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {bucketItems
              .sort((a, b) => b.weightedScore - a.weightedScore)
              .map((item) => (
              <div
                key={item.id}
                className={cn("rounded-lg border border-border bg-card p-3 space-y-2 transition-colors", isAdmin && "cursor-pointer hover:border-primary/40")}
                onClick={() => isAdmin && onEdit(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-foreground leading-tight flex-1">{item.title}</h4>
                  <WeightScoreBadge scores={item as any} weights={weights} total={item.weightedScore} />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className={cn("text-[10px]", PRIORITY_COLORS[item.priority] || "")}>{item.priority}</Badge>
                  <Badge className={cn("text-[10px]", STATUS_COLORS[(item as any).status] || "")}>{(item as any).status}</Badge>
                  {!customerSafe && (
                    <Badge className={cn("text-[10px]", FEATURE_SOURCE_COLORS[(item as any).feature_source] || "")}>{(item as any).feature_source}</Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
