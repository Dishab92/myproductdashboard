import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Settings, FileText } from "lucide-react";
import { toast } from "sonner";
import { WeightedSheetView } from "@/components/roadmap/WeightedSheetView";
import { AgentHelperTableView } from "@/components/roadmap/AgentHelperTableView";
import { AgentHelperTimelineView } from "@/components/roadmap/AgentHelperTimelineView";
import { RoadmapItemDialog } from "@/components/roadmap/RoadmapItemDialog";
import { BulkImportDialog } from "@/components/roadmap/BulkImportDialog";
import { WeightConfigDialog } from "@/components/roadmap/WeightConfigDialog";
import { DeckGenerator } from "@/components/roadmap/DeckGenerator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  AH_STATUSES, AH_FEATURE_TYPES, AH_FEATURE_SOURCES, AH_PRIORITIES, AH_TARGET_BUCKETS,
  DEFAULT_WEIGHTS, type ScoringWeights,
} from "@/lib/agent-helper-constants";
import type { RoadmapItem } from "@/components/roadmap/RoadmapCard";

export default function AgentHelperRoadmap() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);

  // Filters
  const [bucketFilter, setBucketFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [customerSafe, setCustomerSafe] = useState(false);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<RoadmapItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<RoadmapItem | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [weightConfigOpen, setWeightConfigOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    const { data, error } = await (supabase.from("roadmap_items") as any)
      .select("*")
      .eq("product_type", "Agent Helper")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load roadmap"); return; }
    setItems(data || []);
    setLoading(false);
  }, []);

  const fetchWeights = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase.from("scoring_weights") as any)
      .select("*").eq("owner_id", user.id).eq("product_type", "Agent Helper").maybeSingle();
    if (data) {
      setWeights({
        w_common_customer_ask: data.w_common_customer_ask,
        w_competitor_market_research: data.w_competitor_market_research,
        w_seller_prospect_input: data.w_seller_prospect_input,
        w_technical_debt: data.w_technical_debt,
        w_executive_input: data.w_executive_input,
      });
    }
  }, []);

  useEffect(() => { fetchItems(); fetchWeights(); }, [fetchItems, fetchWeights]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    const { error } = await (supabase.from("roadmap_items") as any).delete().eq("id", deleteItem.id);
    if (error) toast.error("Delete failed");
    else { toast.success("Deleted"); fetchItems(); }
    setDeleteItem(null);
  };

  // Apply filters
  let filtered = items;
  if (bucketFilter !== "All") filtered = filtered.filter((i) => (i as any).target_bucket === bucketFilter);
  if (statusFilter !== "All") filtered = filtered.filter((i) => i.status === statusFilter);
  if (typeFilter !== "All") filtered = filtered.filter((i) => (i as any).feature_type === typeFilter);
  if (sourceFilter !== "All") filtered = filtered.filter((i) => (i as any).feature_source === sourceFilter);
  if (priorityFilter !== "All") filtered = filtered.filter((i) => i.priority === priorityFilter);
  if (customerSafe) {
    filtered = filtered.filter((i) => i.customer_visibility === "Customer Safe");
    filtered = filtered.filter((i) => (i as any).feature_source !== "Technical Debt");
  }

  return (
    <div className="p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={bucketFilter} onValueChange={setBucketFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Bucket" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Buckets</SelectItem>
            {AH_TARGET_BUCKETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {AH_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            {AH_FEATURE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Sources</SelectItem>
            {AH_FEATURE_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[90px] h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {AH_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Customer Safe</Label>
          <Switch checked={customerSafe} onCheckedChange={setCustomerSafe} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setWeightConfigOpen(true)}>
              <Settings className="w-3.5 h-3.5" /> Weights
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setBulkOpen(true)}>
              <Upload className="w-3.5 h-3.5" /> Import
            </Button>
          )}
          <DeckGenerator items={filtered} customerSafe={customerSafe} />
          {isAdmin && (
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
              <Plus className="w-3.5 h-3.5" /> Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Views */}
      <Tabs defaultValue="sheet">
        <TabsList>
          <TabsTrigger value="sheet">Weighted Sheet</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="sheet">
          {loading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p> : (
            <WeightedSheetView items={filtered} weights={weights} onEdit={(i) => { setEditItem(i); setDialogOpen(true); }} onRefresh={fetchItems} customerSafe={customerSafe} isAdmin={isAdmin} />
          )}
        </TabsContent>

        <TabsContent value="table">
          {loading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p> : (
            <AgentHelperTableView items={filtered} weights={weights} onEdit={(i) => { setEditItem(i); setDialogOpen(true); }} onDelete={setDeleteItem} customerSafe={customerSafe} isAdmin={isAdmin} />
          )}
        </TabsContent>

        <TabsContent value="timeline">
          {loading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p> : (
            <AgentHelperTimelineView items={filtered} weights={weights} onEdit={(i) => { setEditItem(i); setDialogOpen(true); }} customerSafe={customerSafe} isAdmin={isAdmin} />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <RoadmapItemDialog open={dialogOpen} onOpenChange={setDialogOpen} item={editItem} onSaved={fetchItems} agentHelperMode />
      <BulkImportDialog open={bulkOpen} onOpenChange={setBulkOpen} onImported={fetchItems} />
      <WeightConfigDialog open={weightConfigOpen} onOpenChange={setWeightConfigOpen} weights={weights} onSaved={setWeights} />

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
