import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SCORE_DIMENSIONS, WEIGHT_KEYS, DEFAULT_WEIGHTS, type ScoringWeights } from "@/lib/agent-helper-constants";

interface WeightConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weights: ScoringWeights;
  onSaved: (w: ScoringWeights) => void;
}

export function WeightConfigDialog({ open, onOpenChange, weights, onSaved }: WeightConfigDialogProps) {
  const [form, setForm] = useState<ScoringWeights>(weights);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(weights); }, [weights, open]);

  const total = WEIGHT_KEYS.reduce((s, k) => s + (form[k] || 0), 0);

  const handleSave = async () => {
    if (total !== 100) { toast.error("Weights must total 100"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await (supabase.from("scoring_weights") as any)
      .upsert({ owner_id: user.id, product_type: "Agent Helper", ...form }, { onConflict: "owner_id,product_type" });

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Weights saved");
    onSaved(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Weight Configuration</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          {SCORE_DIMENSIONS.map((d, i) => (
            <div key={d.key} className="flex items-center justify-between gap-3">
              <Label className="text-xs flex-1">{d.shortLabel}</Label>
              <Input
                type="number" min={0} max={100}
                className="w-20 h-8 text-xs text-right"
                value={form[WEIGHT_KEYS[i]]}
                onChange={(e) => setForm((f) => ({ ...f, [WEIGHT_KEYS[i]]: parseInt(e.target.value) || 0 }))}
              />
              <span className="text-xs text-muted-foreground w-4">%</span>
            </div>
          ))}
          <div className={`flex items-center justify-between text-sm font-semibold pt-2 border-t border-border ${total !== 100 ? "text-destructive" : "text-foreground"}`}>
            <span>Total</span>
            <span>{total}%</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || total !== 100}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
