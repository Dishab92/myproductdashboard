import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Users } from "lucide-react";
import type { TenantConfig } from "@/lib/types";

interface Props {
  open: boolean;
  tenantIds: string[];
  existingConfig: TenantConfig[];
  fileName: string;
  eventCount: number;
  dateRange: { min: Date; max: Date };
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

function suggestNameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  const stopWords = new Set(["since", "from", "to", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec", "january", "february", "march", "april", "june", "july", "august", "september", "october", "november", "december"]);
  const parts = base.split(/[\s_\-–]+/);
  const words: string[] = [];
  for (const p of parts) {
    if (/^\d+$/.test(p)) break;
    if (stopWords.has(p.toLowerCase())) break;
    words.push(p);
  }
  return words.join(" ").trim();
}

export function CustomerMappingDialog({ open, tenantIds, existingConfig, fileName, eventCount, dateRange, onConfirm, onCancel }: Props) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const configMap = new Map(existingConfig.map(c => [c.tenant_id, c.customer_name]));
    const suggestion = tenantIds.length === 1 ? suggestNameFromFile(fileName) : "";
    const initial: Record<string, string> = {};
    for (const id of tenantIds) {
      initial[id] = configMap.get(id) || (tenantIds.length === 1 ? suggestion : "");
    }
    setMapping(initial);
    setErrors({});
  }, [open, tenantIds, existingConfig, fileName]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const seen = new Map<string, string>();
    for (const id of tenantIds) {
      const name = (mapping[id] || "").trim();
      if (!name) {
        newErrors[id] = "Customer name is required";
        continue;
      }
      const lower = name.toLowerCase();
      if (seen.has(lower)) {
        newErrors[id] = `Duplicate of "${seen.get(lower)}"`;
      } else {
        seen.set(lower, name);
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    const trimmed: Record<string, string> = {};
    for (const id of tenantIds) trimmed[id] = (mapping[id] || "").trim();
    onConfirm(trimmed);
  };

  const updateName = (id: string, value: string) => {
    setMapping(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const isSingle = tenantIds.length === 1;
  const customerSummary = tenantIds.map(id => (mapping[id] || "").trim()).filter(Boolean).join(", ");
  const dateLabel = `${format(dateRange.min, "MMM yyyy")} – ${format(dateRange.max, "MMM yyyy")}`;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Map Customer {isSingle ? "Name" : "Names"}
          </DialogTitle>
          <DialogDescription>
            {isSingle
              ? `One tenant detected. Assign a customer name before importing.`
              : `${tenantIds.length} tenants detected. Assign a name for each before importing.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isSingle ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Tenant ID: <span className="font-mono text-foreground">{tenantIds[0]}</span></p>
              <Input
                placeholder="Enter customer name"
                value={mapping[tenantIds[0]] || ""}
                onChange={(e) => updateName(tenantIds[0], e.target.value)}
                className={errors[tenantIds[0]] ? "border-destructive" : ""}
                autoFocus
              />
              {errors[tenantIds[0]] && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[tenantIds[0]]}</p>}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs">Tenant ID</TableHead>
                    <TableHead className="text-xs">Customer Name (Required)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantIds.map(id => (
                    <TableRow key={id}>
                      <TableCell className="font-mono text-xs py-2">{id}</TableCell>
                      <TableCell className="py-2">
                        <Input
                          placeholder="Customer name"
                          value={mapping[id] || ""}
                          onChange={(e) => updateName(id, e.target.value)}
                          className={`h-8 text-sm ${errors[id] ? "border-destructive" : ""}`}
                        />
                        {errors[id] && <p className="text-xs text-destructive mt-1">{errors[id]}</p>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="rounded-lg bg-muted/50 border p-3 space-y-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-primary" /> Ready to import:
            </p>
            {customerSummary && <p className="text-xs text-muted-foreground">Customer: <span className="text-foreground font-medium">{customerSummary}</span></p>}
            <p className="text-xs text-muted-foreground">Rows: <span className="text-foreground font-medium">{eventCount.toLocaleString()}</span></p>
            <p className="text-xs text-muted-foreground">Date Range: <span className="text-foreground font-medium">{dateLabel}</span></p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm &amp; Import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
