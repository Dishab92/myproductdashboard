import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function TrendBadge({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-health-green bg-health-green px-1.5 py-0.5 rounded">
        <TrendingUp className="w-3 h-3" />
        +{value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-health-red bg-health-red px-1.5 py-0.5 rounded">
        <TrendingDown className="w-3 h-3" />
        {value}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
      <Minus className="w-3 h-3" />
      0%
    </span>
  );
}
