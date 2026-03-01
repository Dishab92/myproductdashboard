import { RoadmapCard, type RoadmapItem } from "./RoadmapCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUSES = ["Backlog", "In Progress", "Beta", "Released"] as const;

interface KanbanBoardProps {
  items: RoadmapItem[];
  onEdit: (item: RoadmapItem) => void;
  onRefresh: () => void;
  hideNotes?: boolean;
}

export function KanbanBoard({ items, onEdit, onRefresh, hideNotes }: KanbanBoardProps) {
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("text/plain");
    if (!itemId) return;

    const { error } = await (supabase.from("roadmap_items") as any).update({ status: newStatus }).eq("id", itemId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Moved to ${newStatus}`);
      onRefresh();
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4 min-h-[400px]">
      {STATUSES.map((status) => {
        const columnItems = items.filter((i) => i.status === status);
        return (
          <div
            key={status}
            className="flex flex-col rounded-lg border border-border bg-muted/30 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {status}
              </h3>
              <span className="text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                {columnItems.length}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {columnItems.map((item) => (
                <RoadmapCard
                  key={item.id}
                  item={item}
                  onClick={() => onEdit(item)}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                  hideNotes={hideNotes}
                />
              ))}
              {columnItems.length === 0 && (
                <p className="text-xs text-muted-foreground/50 text-center py-8">Drop items here</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
