import { RoadmapCard, type RoadmapItem } from "./RoadmapCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRODUCT_HEADER_COLORS: Record<string, string> = {
  "Agent Helper": "text-cyan-400",
  "Case QA": "text-violet-400",
  "Escalation Manager": "text-amber-400",
};

interface TimelineViewProps {
  items: RoadmapItem[];
  onEdit: (item: RoadmapItem) => void;
  hideNotes?: boolean;
}

export function TimelineView({ items, onEdit, hideNotes }: TimelineViewProps) {
  const quarters = [...new Set(items.map((i) => i.release_quarter || "Unscheduled"))].sort();

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {quarters.map((q) => {
        const qItems = items.filter((i) => (i.release_quarter || "Unscheduled") === q);
        const byProduct = qItems.reduce<Record<string, RoadmapItem[]>>((acc, item) => {
          (acc[item.product_type] ||= []).push(item);
          return acc;
        }, {});

        return (
          <div key={q} className="min-w-[300px] flex-shrink-0">
            <div className="mb-4 pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">{q}</h3>
              <span className="text-[10px] text-muted-foreground">{qItems.length} items</span>
            </div>
            <div className="space-y-4">
              {Object.entries(byProduct).map(([product, pItems]) => (
                <div key={product}>
                  <p className={cn("text-xs font-semibold mb-2", PRODUCT_HEADER_COLORS[product] || "text-foreground")}>
                    {product}
                  </p>
                  <div className="space-y-2">
                    {pItems.map((item) => (
                      <RoadmapCard key={item.id} item={item} onClick={() => onEdit(item)} hideNotes={hideNotes} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {quarters.length === 0 && (
        <p className="text-sm text-muted-foreground py-12 text-center w-full">No items to display</p>
      )}
    </div>
  );
}
