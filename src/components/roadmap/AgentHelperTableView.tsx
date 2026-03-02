import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import {
  STATUS_COLORS, FEATURE_TYPE_COLORS, FEATURE_SOURCE_COLORS,
  computeWeightedScore, type ScoringWeights,
} from "@/lib/agent-helper-constants";
import { WeightScoreBadge } from "./WeightScoreBadge";
import type { RoadmapItem } from "./RoadmapCard";

const PRIORITY_COLORS: Record<string, string> = {
  P0: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
  P1: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
  P2: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
  P3: "bg-muted text-muted-foreground border-border",
};

interface AgentHelperTableViewProps {
  items: RoadmapItem[];
  weights: ScoringWeights;
  onEdit: (item: RoadmapItem) => void;
  onDelete: (item: RoadmapItem) => void;
  customerSafe: boolean;
  isAdmin: boolean;
}

export function AgentHelperTableView({ items, weights, onEdit, onDelete, customerSafe, isAdmin }: AgentHelperTableViewProps) {
  const scored = items.map((item) => ({
    ...item,
    weightedScore: computeWeightedScore(item, weights),
  })).sort((a, b) => b.weightedScore - a.weightedScore);

  return (
    <div className="border border-border rounded-lg overflow-auto max-h-[70vh]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <tr>
            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Status</th>
            <th className="text-left px-2 py-2.5 font-medium text-muted-foreground">Type</th>
            <th className="text-left px-2 py-2.5 font-medium text-muted-foreground">Source</th>
            <th className="text-center px-2 py-2.5 font-medium text-muted-foreground">Priority</th>
            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground min-w-[200px]">Title</th>
            <th className="text-left px-2 py-2.5 font-medium text-muted-foreground">Bucket</th>
            <th className="text-left px-2 py-2.5 font-medium text-muted-foreground">Sprint</th>
            <th className="text-left px-2 py-2.5 font-medium text-muted-foreground">Jira</th>
            {!customerSafe && <th className="text-left px-2 py-2.5 font-medium text-muted-foreground min-w-[150px]">Comments</th>}
            <th className="text-center px-2 py-2.5 font-medium text-muted-foreground">Score</th>
            {isAdmin && <th className="text-center px-2 py-2.5 font-medium text-muted-foreground w-[80px]">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {scored.map((item) => (
            <tr key={item.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
              <td className="px-3 py-2"><Badge className={cn("text-[10px] whitespace-nowrap", STATUS_COLORS[item.status] || "")}>{item.status}</Badge></td>
              <td className="px-2 py-2"><Badge className={cn("text-[10px] whitespace-nowrap", FEATURE_TYPE_COLORS[item.feature_type] || "")}>{item.feature_type}</Badge></td>
              <td className="px-2 py-2"><Badge className={cn("text-[10px] whitespace-nowrap", FEATURE_SOURCE_COLORS[item.feature_source] || "")}>{item.feature_source}</Badge></td>
              <td className="px-2 py-2 text-center"><Badge className={cn("text-[10px] whitespace-nowrap", PRIORITY_COLORS[item.priority] || "")}>{item.priority}</Badge></td>
              <td className="px-3 py-2 font-medium text-foreground">{item.title}</td>
              <td className="px-2 py-2 text-muted-foreground">{item.target_bucket}</td>
              <td className="px-2 py-2 text-muted-foreground">{item.sprint || "—"}</td>
              <td className="px-2 py-2">
                {item.jira_link ? (
                  <a href={item.jira_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Link</a>
                ) : <span className="text-muted-foreground/40">—</span>}
              </td>
              {!customerSafe && <td className="px-2 py-2 text-muted-foreground line-clamp-2 max-w-[200px]">{item.notes || "—"}</td>}
              <td className="px-2 py-2 text-center">
                <WeightScoreBadge scores={item} weights={weights} total={item.weightedScore} />
              </td>
              {isAdmin && (
                <td className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(item)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(item)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {scored.length === 0 && (
            <tr><td colSpan={11} className="text-center py-8 text-muted-foreground">No items found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
