import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AH_STATUSES, AH_FEATURE_TYPES, AH_FEATURE_SOURCES, AH_PRIORITIES, AH_TARGET_BUCKETS,
  SCORE_DIMENSIONS,
} from "@/lib/agent-helper-constants";
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
  agentHelperMode?: boolean;
}

export function RoadmapItemDialog({ open, onOpenChange, item, onSaved, agentHelperMode }: RoadmapItemDialogProps) {
  const [form, setForm] = useState({
    title: "", description: "", product_type: "Agent Helper", category: "Feature",
    priority: "P1", status: agentHelperMode ? "To Do" : "Backlog",
    release_quarter: "", target_date: "",
    owner: "", customer_visibility: "Internal", linked_customers: "", notes: "",
    // Agent Helper fields
    target_bucket: "Future", sprint: "", jira_link: "",
    feature_type: "New Feature", feature_source: "Product",
    score_common_customer_ask: 0, score_competitor_market_research: 0,
    score_seller_prospect_input: 0, score_technical_debt: 0, score_executive_input: 0,
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
        target_bucket: item.target_bucket || "Future", sprint: item.sprint || "",
        jira_link: item.jira_link || "", feature_type: item.feature_type || "New Feature",
        feature_source: item.feature_source || "Product",
        score_common_customer_ask: item.score_common_customer_ask || 0,
        score_competitor_market_research: item.score_competitor_market_research || 0,
        score_seller_prospect_input: item.score_seller_prospect_input || 0,
        score_technical_debt: item.score_technical_debt || 0,
        score_executive_input: item.score_executive_input || 0,
      });
    } else {
      setForm({
        title: "", description: "", product_type: agentHelperMode ? "Agent Helper" : "Agent Helper",
        category: "Feature", priority: "P1", status: agentHelperMode ? "To Do" : "Backlog",
        release_quarter: "", target_date: "", owner: "", customer_visibility: "Internal",
        linked_customers: "", notes: "", target_bucket: "Future", sprint: "", jira_link: "",
        feature_type: "New Feature", feature_source: "Product",
        score_common_customer_ask: 0, score_competitor_market_research: 0,
        score_seller_prospect_input: 0, score_technical_debt: 0, score_executive_input: 0,
      });
    }
  }, [item, open, agentHelperMode]);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not authenticated"); setSaving(false); return; }

    const payload = {
      title: form.title.trim(), description: form.description, product_type: form.product_type,
      category: form.category, priority: form.priority, status: form.status,
      release_quarter: form.release_quarter || null, target_date: form.target_date || null,
      owner: form.owner, customer_visibility: form.customer_visibility,
      linked_customers: form.linked_customers.split(",").map((s) => s.trim()).filter(Boolean),
      notes: form.notes, owner_id: user.id,
      target_bucket: form.target_bucket, sprint: form.sprint, jira_link: form.jira_link,
      feature_type: form.feature_type, feature_source: form.feature_source,
      score_common_customer_ask: form.score_common_customer_ask,
      score_competitor_market_research: form.score_competitor_market_research,
      score_seller_prospect_input: form.score_seller_prospect_input,
      score_technical_debt: form.score_technical_debt,
      score_executive_input: form.score_executive_input,
    };

    let error;
    if (item) {
      ({ error } = await supabase.from("roadmap_items").update(payload).eq("id", item.id));
    } else {
      ({ error } = await supabase.from("roadmap_items").insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(item ? "Item updated" : "Item created");
    onOpenChange(false);
    onSaved();
  };

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const statusOptions = agentHelperMode ? AH_STATUSES : STATUSES;
  const priorityOptions = agentHelperMode ? AH_PRIORITIES : PRIORITIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "New Item"}{agentHelperMode ? " — Agent Helper" : ""}</DialogTitle>
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
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{priorityOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {agentHelperMode && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Feature Type</Label>
                  <Select value={form.feature_type} onValueChange={(v) => set("feature_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{AH_FEATURE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Feature Source</Label>
                  <Select value={form.feature_source} onValueChange={(v) => set("feature_source", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{AH_FEATURE_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Target Bucket</Label>
                  <Select value={form.target_bucket} onValueChange={(v) => set("target_bucket", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{AH_TARGET_BUCKETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Sprint</Label>
                  <Input value={form.sprint} onChange={(e) => set("sprint", e.target.value)} placeholder="Sprint name" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Jira Link</Label>
                <Input value={form.jira_link} onChange={(e) => set("jira_link", e.target.value)} placeholder="https://jira.example.com/..." />
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <Label className="text-xs font-semibold">Scoring (0–5)</Label>
                {SCORE_DIMENSIONS.map((d) => (
                  <div key={d.key} className="flex items-center gap-3">
                    <Label className="text-[11px] w-32 shrink-0">{d.shortLabel}</Label>
                    <Slider
                      value={[form[d.key as keyof typeof form] as number]}
                      onValueChange={([v]) => set(d.key, v)}
                      min={0} max={5} step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono w-4 text-right">{form[d.key as keyof typeof form] as number}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!agentHelperMode && (
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
          )}

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
