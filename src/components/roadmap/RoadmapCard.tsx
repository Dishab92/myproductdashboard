import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  product_type: string;
  category: string;
  priority: string;
  status: string;
  release_quarter: string | null;
  target_date: string | null;
  owner: string;
  customer_visibility: string;
  linked_customers: string[];
  notes: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

const PRODUCT_COLORS: Record<string, string> = {
  "Agent Helper": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Case QA": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "Escalation Manager": "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: "bg-red-500/20 text-red-300 border-red-500/30",
  P1: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  P2: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  P3: "bg-muted text-muted-foreground border-border",
};

interface RoadmapCardProps {
  item: RoadmapItem;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  hideNotes?: boolean;
}

export function RoadmapCard({ item, onClick, draggable, onDragStart, hideNotes }: RoadmapCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 space-y-2 cursor-pointer hover:border-primary/40 transition-colors",
        draggable && "cursor-grab active:cursor-grabbing"
      )}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-foreground leading-tight">{item.title}</h4>
        <Badge className={cn("text-[10px] shrink-0", PRIORITY_COLORS[item.priority] || "")}>
          {item.priority}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge className={cn("text-[10px]", PRODUCT_COLORS[item.product_type] || "")}>
          {item.product_type}
        </Badge>
        {item.release_quarter && (
          <span className="text-[10px] text-muted-foreground">{item.release_quarter}</span>
        )}
      </div>
      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}
      {item.owner && (
        <p className="text-[10px] text-muted-foreground/70">Owner: {item.owner}</p>
      )}
    </div>
  );
}
