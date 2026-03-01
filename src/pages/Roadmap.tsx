import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { KanbanBoard } from "@/components/roadmap/KanbanBoard";
import { TimelineView } from "@/components/roadmap/TimelineView";
import { TableView } from "@/components/roadmap/TableView";
import { RoadmapItemDialog } from "@/components/roadmap/RoadmapItemDialog";
import { DeckGenerator } from "@/components/roadmap/DeckGenerator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { RoadmapItem } from "@/components/roadmap/RoadmapCard";

export default function Roadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("All");
  const [quarterFilter, setQuarterFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [customerSafe, setCustomerSafe] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<RoadmapItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<RoadmapItem | null>(null);

  const fetchItems = useCallback(async () => {
    const { data, error } = await (supabase.from("roadmap_items") as any).select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load roadmap"); return; }
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    const { error } = await (supabase.from("roadmap_items") as any).delete().eq("id", deleteItem.id);
    if (error) toast.error("Delete failed");
    else { toast.success("Deleted"); fetchItems(); }
    setDeleteItem(null);
  };

  // Apply filters
  let filtered = items;
  if (productFilter !== "All") filtered = filtered.filter((i) => i.product_type === productFilter);
  if (quarterFilter !== "All") filtered = filtered.filter((i) => (i.release_quarter || "Unscheduled") === quarterFilter);
  if (priorityFilter !== "All") filtered = filtered.filter((i) => i.priority === priorityFilter);
  if (customerSafe) filtered = filtered.filter((i) => i.customer_visibility === "Customer Safe");

  const quarters = [...new Set(items.map((i) => i.release_quarter || "Unscheduled"))].sort();

  return (
    <div className="p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Products</SelectItem>
            <SelectItem value="Agent Helper">Agent Helper</SelectItem>
            <SelectItem value="Case QA">Case QA</SelectItem>
            <SelectItem value="Escalation Manager">Escalation Manager</SelectItem>
          </SelectContent>
        </Select>

        <Select value={quarterFilter} onValueChange={setQuarterFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Quarters</SelectItem>
            {quarters.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="P0">P0</SelectItem>
            <SelectItem value="P1">P1</SelectItem>
            <SelectItem value="P2">P2</SelectItem>
            <SelectItem value="P3">P3</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <Label className="text-xs text-muted-foreground">Customer Safe</Label>
          <Switch checked={customerSafe} onCheckedChange={setCustomerSafe} />
        </div>

        <DeckGenerator items={filtered} customerSafe={customerSafe} />

        <Button size="sm" className="gap-1.5" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {/* Views */}
      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          {loading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p> : (
            <KanbanBoard items={filtered} onEdit={(i) => { setEditItem(i); setDialogOpen(true); }} onRefresh={fetchItems} hideNotes={customerSafe} />
          )}
        </TabsContent>

        <TabsContent value="timeline">
          {loading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p> : (
            <TimelineView items={filtered} onEdit={(i) => { setEditItem(i); setDialogOpen(true); }} hideNotes={customerSafe} />
          )}
        </TabsContent>

        <TabsContent value="table">
          {loading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p> : (
            <TableView items={filtered} onEdit={(i) => { setEditItem(i); setDialogOpen(true); }} onDelete={setDeleteItem} hideNotes={customerSafe} />
          )}
        </TabsContent>
      </Tabs>

      {/* CRUD Dialog */}
      <RoadmapItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editItem} onSaved={fetchItems} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteItem?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
