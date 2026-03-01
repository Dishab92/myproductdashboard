import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getScoreBreakdown, type ScoringWeights } from "@/lib/agent-helper-constants";

interface WeightScoreBadgeProps {
  scores: Record<string, number>;
  weights: ScoringWeights;
  total: number;
}

export function WeightScoreBadge({ scores, weights, total }: WeightScoreBadgeProps) {
  const color =
    total >= 80 ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" :
    total >= 50 ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30" :
    "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30";

  const breakdown = getScoreBreakdown(scores, weights);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={cn("text-xs font-mono cursor-help", color)}>
          {Math.round(total)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[260px]">
        <p className="font-semibold text-xs mb-1.5">Score Breakdown</p>
        <div className="space-y-1">
          {breakdown.map((b) => (
            <div key={b.label} className="flex justify-between text-[10px] gap-3">
              <span className="text-muted-foreground">{b.label} ({b.raw}/5 × {b.weight}%)</span>
              <span className="font-mono">{b.contribution.toFixed(1)}</span>
            </div>
          ))}
          <div className="border-t border-border pt-1 flex justify-between text-xs font-semibold">
            <span>Total</span>
            <span className="font-mono">{Math.round(total)}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
