import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

const EXPECTED_COLS = [
  "title", "status", "feature_type", "feature_source", "priority",
  "target_bucket", "jira_link", "comments",
  "score_common_customer_ask", "score_competitor_market_research",
  "score_seller_prospect_input", "score_technical_debt", "score_executive_input",
];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ""; });
    return row;
  });
}

export function BulkImportDialog({ open, onOpenChange, onImported }: BulkImportDialogProps) {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);

  const handleParse = () => {
    const rows = parseCSV(csv);
    if (rows.length === 0) { toast.error("No data rows found"); return; }
    if (!rows[0].title) { toast.error("Missing 'title' column"); return; }
    setPreview(rows);
  };

  const handleImport = async () => {
    setImporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setImporting(false); return; }

    const payload = preview.map((row) => ({
      title: row.title || "Untitled",
      status: row.status || "To Do",
      feature_type: row.feature_type || "New Feature",
      feature_source: row.feature_source || "Product",
      priority: row.priority || "P1",
      target_bucket: row.target_bucket || "Future",
      jira_link: row.jira_link || "",
      notes: row.comments || "",
      product_type: "Agent Helper",
      owner_id: user.id,
      score_common_customer_ask: parseInt(row.score_common_customer_ask) || 0,
      score_competitor_market_research: parseInt(row.score_competitor_market_research) || 0,
      score_seller_prospect_input: parseInt(row.score_seller_prospect_input) || 0,
      score_technical_debt: parseInt(row.score_technical_debt) || 0,
      score_executive_input: parseInt(row.score_executive_input) || 0,
    }));

    const { error } = await (supabase.from("roadmap_items") as any).insert(payload);
    setImporting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Imported ${payload.length} items`);
    setCsv(""); setPreview([]);
    onOpenChange(false);
    onImported();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Bulk Import — Agent Helper</DialogTitle></DialogHeader>
        {preview.length === 0 ? (
          <div className="space-y-3">
            <Label className="text-xs">Paste CSV (first row = headers)</Label>
            <p className="text-[10px] text-muted-foreground">
              Expected columns: {EXPECTED_COLS.join(", ")}
            </p>
            <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} placeholder="title,status,feature_type,..." className="font-mono text-xs" />
            <Button onClick={handleParse} disabled={!csv.trim()}>Parse & Preview</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{preview.length} rows ready to import</p>
            <div className="border border-border rounded-lg overflow-auto max-h-[300px]">
              <table className="w-full text-[10px]">
                <thead className="bg-muted/80 sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Title</th>
                    <th className="px-2 py-1.5 text-left">Status</th>
                    <th className="px-2 py-1.5 text-left">Type</th>
                    <th className="px-2 py-1.5 text-left">Priority</th>
                    <th className="px-2 py-1.5 text-left">Bucket</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-2 py-1">{row.title}</td>
                      <td className="px-2 py-1">{row.status}</td>
                      <td className="px-2 py-1">{row.feature_type}</td>
                      <td className="px-2 py-1">{row.priority}</td>
                      <td className="px-2 py-1">{row.target_bucket}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setPreview([])}>Back</Button>
              <Button size="sm" onClick={handleImport} disabled={importing}>
                {importing ? "Importing..." : `Import ${preview.length} Items`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
