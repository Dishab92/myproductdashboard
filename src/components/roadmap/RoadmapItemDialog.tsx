import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RoadmapItem } from "./RoadmapCard";

const PRODUCTS = ["Agent Helper", "Case QA", "Escalation Manager"];
const CATEGORIES = ["Feature", "Enhancement", "Bug", "Infra"];
const PRIORITIES = ["P0", "P1", "P2", "P3"];
const STATUSES = ["Backlog", "In Progress", "Beta", "Released"];
const VISIBILITY = ["Internal", "Customer Safe"];

interface RoadmapItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: RoadmapItem | null;
  onSaved: () => void;
}

export function RoadmapItemDialog({ open, onOpenChange, item, onSaved }: RoadmapItemDialogProps) {
  const [form, setForm] = useState({
    title: "", description: "", product_type: "Agent Helper", category: "Feature",
    priority: "P1", status: "Backlog", release_quarter: "", target_date: "",
    owner: "", customer_visibility: "Internal", linked_customers: "",  notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title, description: item.description, product_type: item.product_type,
        category: item.category, priority: item.priority, status: item.status,
        release_quarter: item.release_quarter || "", target_date: item.target_date || "",
        owner: item.owner, customer_visibility: item.customer_visibility,
        linked_customers: item.linked_customers.join(", "), notes: item.notes,
      });
    } else {
      setForm({
        title: "", description: "", product_type: "Agent Helper", category: "Feature",
        priority: "P1", status: "Backlog", release_quarter: "", target_date: "",
        owner: "", customer_visibility: "Internal", linked_customers: "", notes: "",
      });
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setSaving(false); return; }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      product_type: form.product_type,
      category: form.category,
      priority: form.priority,
      status: form.status,
      release_quarter: form.release_quarter || null,
      target_date: form.target_date || null,
      owner: form.owner,
      customer_visibility: form.customer_visibility,
      linked_customers: form.linked_customers.split(",").map((s) => s.trim()).filter(Boolean),
      notes: form.notes,
      owner_id: user.id,
    };

    let error;
    if (item) {
      ({ error } = await (supabase.from("roadmap_items") as any).update(payload).eq("id", item.id));
    } else {
      ({ error } = await (supabase.from("roadmap_items") as any).insert(payload));
    }

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(item ? "Item updated" : "Item created");
    onOpenChange(false);
    onSaved();
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Roadmap Item" : "New Roadmap Item"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Feature title" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Product</Label>
              <Select value={form.product_type} onValueChange={(v) => set("product_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Release Quarter</Label>
              <Input value={form.release_quarter} onChange={(e) => set("release_quarter", e.target.value)} placeholder="Q1 2026" />
            </div>
            <div>
              <Label className="text-xs">Target Date</Label>
              <Input type="date" value={form.target_date} onChange={(e) => set("target_date", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Owner</Label>
            <Input value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Name" />
          </div>
          <div>
            <Label className="text-xs">Visibility</Label>
            <Select value={form.customer_visibility} onValueChange={(v) => set("customer_visibility", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VISIBILITY.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Linked Customers (comma-separated)</Label>
            <Input value={form.linked_customers} onChange={(e) => set("linked_customers", e.target.value)} placeholder="Customer A, Customer B" />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
