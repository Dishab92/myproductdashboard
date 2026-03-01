import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SCORE_DIMENSIONS, STATUS_COLORS, FEATURE_TYPE_COLORS, FEATURE_SOURCE_COLORS,
  computeWeightedScore, type ScoringWeights,
} from "@/lib/agent-helper-constants";
import { WeightScoreBadge } from "./WeightScoreBadge";
import type { RoadmapItem } from "./RoadmapCard";

interface WeightedSheetViewProps {
  items: RoadmapItem[];
  weights: ScoringWeights;
  onEdit: (item: RoadmapItem) => void;
  onRefresh: () => void;
  customerSafe: boolean;
  isAdmin: boolean;
}

export function WeightedSheetView({ items, weights, onEdit, onRefresh, customerSafe, isAdmin }: WeightedSheetViewProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; key: string } | null>(null);

  const scored = items.map((item) => ({
    ...item,
    weightedScore: computeWeightedScore(item as any, weights),
  })).sort((a, b) => b.weightedScore - a.weightedScore);

  const handleScoreChange = async (itemId: string, key: string, val: number) => {
    setEditingCell(null);
    const { error } = await (supabase.from("roadmap_items") as any).update({ [key]: val }).eq("id", itemId);
    if (error) toast.error("Failed to update score");
    else onRefresh();
  };

  const PRIORITY_COLORS: Record<string, string> = {
    P0: "bg-red-500/20 text-red-300 border-red-500/30",
    P1: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    P2: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    P3: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="border border-border rounded-lg overflow-auto max-h-[70vh]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <tr>
            <th className="text-left px-3 py-2.5 font-medium text-muted-foreground sticky left-0 bg-muted/80 min-w-[200px]">Feature</th>
            <th className="text-left px-2 py-2.5 font-medium text-muted-foreground min-w-[120px]">Status</th>
            <th className="text-left px-2 py-2.5 font-medium text-muted-foreground min-w-[120px]">Type</th>
            <th className="text-left px-2 py-2.5 font-medium text-muted-foreground min-w-[100px]">Source</th>
            <th className="text-center px-2 py-2.5 font-medium text-muted-foreground w-[50px]">Pri</th>
            <th className="text-left px-2 py-2.5 font-medium text-muted-foreground min-w-[100px]">Bucket</th>
            {!customerSafe && <th className="text-left px-2 py-2.5 font-medium text-muted-foreground min-w-[80px]">Jira</th>}
            {SCORE_DIMENSIONS.map((d) => (
              <th key={d.key} className="text-center px-2 py-2.5 font-medium text-muted-foreground min-w-[80px]">
                <span className="block text-[10px] leading-tight">{d.shortLabel}</span>
                <span className="text-[9px] text-muted-foreground/60">({d.defaultWeight}%)</span>
              </th>
            ))}
            <th className="text-center px-2 py-2.5 font-medium text-muted-foreground min-w-[70px]">Score</th>
          </tr>
        </thead>
        <tbody>
          {scored.map((item) => (
            <tr
              key={item.id}
              className={cn("border-t border-border/50 hover:bg-muted/30 transition-colors", isAdmin && "cursor-pointer")}
              onClick={() => isAdmin && onEdit(item)}
            >
              <td className="px-3 py-2 font-medium text-foreground sticky left-0 bg-background/80 backdrop-blur-sm">
                {item.title}
              </td>
              <td className="px-2 py-2">
                <Badge className={cn("text-[10px]", STATUS_COLORS[(item as any).status] || "")}>{(item as any).status}</Badge>
              </td>
              <td className="px-2 py-2">
                <Badge className={cn("text-[10px]", FEATURE_TYPE_COLORS[(item as any).feature_type] || "")}>{(item as any).feature_type}</Badge>
              </td>
              <td className="px-2 py-2">
                <Badge className={cn("text-[10px]", FEATURE_SOURCE_COLORS[(item as any).feature_source] || "")}>{(item as any).feature_source}</Badge>
              </td>
              <td className="px-2 py-2 text-center">
                <Badge className={cn("text-[10px]", PRIORITY_COLORS[item.priority] || "")}>{item.priority}</Badge>
              </td>
              <td className="px-2 py-2 text-muted-foreground">{(item as any).target_bucket}</td>
              {!customerSafe && (
                <td className="px-2 py-2">
                  {(item as any).jira_link ? (
                    <a href={(item as any).jira_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Link</a>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
              )}
              {SCORE_DIMENSIONS.map((d) => {
                const val = (item as any)[d.key] || 0;
                const isEditing = editingCell?.id === item.id && editingCell?.key === d.key;
                return (
                  <td key={d.key} className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    {isAdmin && isEditing ? (
                      <Select
                        defaultValue={String(val)}
                        onValueChange={(v) => handleScoreChange(item.id, d.key, parseInt(v))}
                        open
                        onOpenChange={(o) => !o && setEditingCell(null)}
                      >
                        <SelectTrigger className="h-6 w-12 text-xs mx-auto"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0,1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        className={cn(
                          "w-8 h-6 rounded text-xs font-mono transition-colors",
                          val > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground/40",
                          isAdmin && (val > 0 ? "hover:bg-primary/20" : "hover:bg-muted")
                        )}
                        onClick={() => isAdmin && setEditingCell({ id: item.id, key: d.key })}
                        disabled={!isAdmin}
                      >
                        {val}
                      </button>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                <WeightScoreBadge scores={item as any} weights={weights} total={item.weightedScore} />
              </td>
            </tr>
          ))}
          {scored.length === 0 && (
            <tr><td colSpan={20} className="text-center py-8 text-muted-foreground">No items found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
