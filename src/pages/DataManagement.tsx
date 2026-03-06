import { useState, useEffect, useCallback } from "react";
import { useData, DatasetMeta, UploadSummary } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UploadPanel } from "@/components/dashboard/UploadPanel";
import { TenantConfigTable } from "@/components/dashboard/TenantConfigTable";
import { CustomerMappingDialog } from "@/components/dashboard/CustomerMappingDialog";
import { detectAndParseEventsCSV, parseCustomersCSV, parseScoresCSV } from "@/lib/csv-parser";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Database, FileText, ShieldCheck, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EventRecord } from "@/lib/types";

interface UploadResult {
  success: boolean;
  message: string;
  detectedFormat?: string;
}

interface PendingImport {
  events: EventRecord[];
  tenantIds: string[];
  dateMin: Date;
  dateMax: Date;
  fileName: string;
  detectedFormat: string;
  errors: string[];
}

export default function DataManagement() {
  const { data, appendEvents, replaceEvents, setCustomers, setScores, setTenantConfig, hasData, isLoading, refreshEvents } = useData();
  const { user } = useAuth();
  const [eventsResult, setEventsResult] = useState<UploadResult | null>(null);
  const [customersResult, setCustomersResult] = useState<UploadResult | null>(null);
  const [scoresResult, setScoresResult] = useState<UploadResult | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [uploadMode, setUploadMode] = useState<"append" | "replace">("append");
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingMappedImport, setPendingMappedImport] = useState<{ events: EventRecord[]; meta: DatasetMeta } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDatasets = useCallback(async () => {
    if (!user) return;
    setDatasetsLoading(true);
    try {
      const { data: rows } = await supabase
        .from("datasets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      setDatasets(rows || []);
    } finally {
      setDatasetsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDatasets(); }, [loadDatasets]);

  const handleDeleteDataset = async (datasetId: string) => {
    setDeletingId(datasetId);
    try {
      // Delete associated events first
      await supabase.from("events").delete().eq("dataset_id", datasetId).eq("owner_id", user!.id);
      // Delete dataset record
      await supabase.from("datasets").delete().eq("id", datasetId).eq("owner_id", user!.id);
      toast.success("Dataset deleted");
      await Promise.all([loadDatasets(), refreshEvents()]);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEventsUpload = (text: string, fileName?: string) => {
    const result = detectAndParseEventsCSV(text, data.tenantConfig);
    if (result.errors.length > 0 && result.events.length === 0) {
      setEventsResult({ success: false, message: result.errors.join("; ") });
      return;
    }

    const tenantIds = [...new Set(result.events.map(e => e.customer_id))];
    const sorted = [...result.events].sort((a, b) => a.event_time.getTime() - b.event_time.getTime());
    const dateMin = sorted[0].event_time;
    const dateMax = sorted[sorted.length - 1].event_time;

    setPendingImport({
      events: result.events,
      tenantIds,
      dateMin,
      dateMax,
      fileName: fileName || "upload.csv",
      detectedFormat: result.detectedFormat || "standard",
      errors: result.errors,
    });
  };

  const executeUpload = async (events: EventRecord[], meta: DatasetMeta) => {
    setUploading(true);
    try {
      let summary: UploadSummary;
      if (uploadMode === "replace") {
        summary = await replaceEvents(events, meta);
      } else {
        summary = await appendEvents(events, meta);
      }

      if (summary.error) {
        setEventsResult({ success: false, message: summary.error });
      } else {
        const modeLabel = uploadMode === "replace" ? "Replaced" : "Appended";
        setEventsResult({
          success: true,
          message: `${modeLabel}: ${summary.inserted.toLocaleString()} new rows inserted, ${summary.duplicatesSkipped.toLocaleString()} duplicates skipped (${summary.processed.toLocaleString()} processed).`,
          detectedFormat: meta.detectedFormat,
        });
      }
    } catch (err: any) {
      setEventsResult({ success: false, message: err.message || "Upload failed" });
    } finally {
      setUploading(false);
      loadDatasets();
    }
  };

  const handleMappingConfirm = async (mapping: Record<string, string>) => {
    if (!pendingImport) return;

    // Update tenant config with new mappings
    const existingConfig = [...data.tenantConfig];
    const existingIds = new Set(existingConfig.map(c => c.tenant_id));
    for (const [tenantId, name] of Object.entries(mapping)) {
      if (existingIds.has(tenantId)) {
        const idx = existingConfig.findIndex(c => c.tenant_id === tenantId);
        existingConfig[idx] = { ...existingConfig[idx], customer_name: name };
      } else {
        existingConfig.push({ tenant_id: tenantId, customer_name: name, go_live_date: null, stage: "Active" });
      }
    }
    setTenantConfig(existingConfig);

    // Apply mapping to events
    const mappedEvents = pendingImport.events.map(e => ({
      ...e,
      customer_name: mapping[e.customer_id] || e.customer_name,
    }));

    const meta: DatasetMeta = {
      fileName: pendingImport.fileName,
      detectedFormat: pendingImport.detectedFormat,
    };

    if (uploadMode === "replace" && hasData) {
      setPendingMappedImport({ events: mappedEvents, meta });
      setShowReplaceConfirm(true);
    } else {
      await executeUpload(mappedEvents, meta);
    }

    setPendingImport(null);
  };

  const handleReplaceConfirm = async () => {
    setShowReplaceConfirm(false);
    if (pendingMappedImport) {
      await executeUpload(pendingMappedImport.events, pendingMappedImport.meta);
      setPendingMappedImport(null);
    }
  };

  const handleMappingCancel = () => {
    setPendingImport(null);
    setEventsResult({ success: false, message: "Import cancelled." });
  };

  const handleCustomersUpload = (text: string) => {
    const result = parseCustomersCSV(text);
    if (result.errors.length > 0) {
      setCustomersResult({ success: false, message: result.errors.join("; ") });
      return;
    }
    setCustomers(result.customers);
    setCustomersResult({ success: true, message: `${result.customers.length} customers loaded.` });
  };

  const handleScoresUpload = (text: string) => {
    const result = parseScoresCSV(text);
    if (result.errors.length > 0) {
      setScoresResult({ success: false, message: result.errors.join("; ") });
      return;
    }
    setScores(result.scores);
    setScoresResult({ success: true, message: `${result.scores.length} scores loaded.` });
  };

  // Data Integrity Summary
  const integrityStats = hasData ? {
    rows: data.events.length,
    customers: new Set(data.events.map(e => e.customer_id)).size,
    users: new Set(data.events.map(e => e.user_id)).size,
    dateMin: data.events.reduce((min, e) => e.event_time < min ? e.event_time : min, data.events[0].event_time),
    dateMax: data.events.reduce((max, e) => e.event_time > max ? e.event_time : max, data.events[0].event_time),
    modules: new Set(data.events.map(e => e.feature)).size,
    cases: new Set(data.events.map(e => e.case_id).filter(Boolean)).size,
  } : null;

  return (
    <div className="p-6 space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-bold text-foreground">Data Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload and manage your CSV data — events persist across sessions</p>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <Card className="p-5 border bg-card flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading persisted events…</span>
        </Card>
      )}

      {/* Data Integrity Summary */}
      {integrityStats ? (
        <Card className="p-5 border-2 border-primary/30 bg-card">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">Data Integrity Summary</h3>
            {eventsResult?.detectedFormat && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {eventsResult.detectedFormat === "agent_helper" ? "Agent Helper Format" : "Standard Format"}
              </Badge>
            )}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs">Metric</TableHead>
                  <TableHead className="text-xs text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className="text-sm">Total Rows (Cumulative)</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{integrityStats.rows.toLocaleString()}</TableCell></TableRow>
                <TableRow><TableCell className="text-sm">Unique Customers</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{integrityStats.customers}</TableCell></TableRow>
                <TableRow><TableCell className="text-sm">Unique Users</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{integrityStats.users}</TableCell></TableRow>
                <TableRow><TableCell className="text-sm">Date Range</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{integrityStats.dateMin.toISOString().slice(0, 10)} → {integrityStats.dateMax.toISOString().slice(0, 10)}</TableCell></TableRow>
                <TableRow><TableCell className="text-sm">Modules Detected</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{integrityStats.modules}</TableCell></TableRow>
                <TableRow><TableCell className="text-sm">Cases Detected</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{integrityStats.cases}</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
          {data.lastUpload && (
            <p className="text-xs text-muted-foreground mt-3">
              Last updated: {data.lastUpload.toLocaleString()}
            </p>
          )}
        </Card>
      ) : !isLoading ? (
        <Card className="p-5 border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-card-foreground">No Dataset</h3>
          </div>
          <p className="text-sm text-muted-foreground">No dataset uploaded. Please upload Agent Helper CSV to view analytics.</p>
        </Card>
      ) : null}

      {/* Upload Mode Toggle */}
      <Card className="p-4 border bg-card">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">Upload Mode</h3>
        <RadioGroup value={uploadMode} onValueChange={(v) => setUploadMode(v as "append" | "replace")} className="flex gap-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="append" id="mode-append" />
            <Label htmlFor="mode-append" className="text-sm cursor-pointer">
              <span className="font-medium">Append</span>
              <span className="text-muted-foreground ml-1">(add new rows, skip duplicates)</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="replace" id="mode-replace" />
            <Label htmlFor="mode-replace" className="text-sm cursor-pointer">
              <span className="font-medium">Replace Entire Dataset</span>
              <span className="text-muted-foreground ml-1">(clear all, insert fresh)</span>
            </Label>
          </div>
        </RadioGroup>
      </Card>

      {/* Upload panels */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Upload Files
        </h3>
        <UploadPanel
          title="events.csv (Required)"
          description="Supports standard format and Agent Helper format (auto-detected). Standard: event_time, customer_id, customer_name, product, user_id, session_id, event_name, feature. Agent Helper: ts, tenant_id, user_id, feature_category, feature_name, interaction_type."
          onUpload={handleEventsUpload}
          result={eventsResult}
        />
        {uploading && (
          <Card className="p-4 border bg-card flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Uploading to database…</span>
          </Card>
        )}
        <UploadPanel
          title="customers.csv (Optional)"
          description="Columns: customer_id, customer_name, release, go_live_date, licensed_users, cs_owner"
          onUpload={handleCustomersUpload}
          result={customersResult}
        />
        <UploadPanel
          title="scores.csv (Optional – Case QA)"
          description="Columns: event_time, customer_id, case_id, score_overall, grade, parameters_json (opt)"
          onUpload={handleScoresUpload}
          result={scoresResult}
        />
      </div>

      {/* Tenant Configuration */}
      <TenantConfigTable />

      {/* Customer Mapping Dialog */}
      {pendingImport && (
        <CustomerMappingDialog
          open={!!pendingImport}
          tenantIds={pendingImport.tenantIds}
          existingConfig={data.tenantConfig}
          fileName={pendingImport.fileName}
          eventCount={pendingImport.events.length}
          dateRange={{ min: pendingImport.dateMin, max: pendingImport.dateMax }}
          onConfirm={handleMappingConfirm}
          onCancel={handleMappingCancel}
        />
      )}

      {/* Replace Confirmation Dialog */}
      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Entire Dataset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all existing events and replace them with this upload. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowReplaceConfirm(false); setPendingMappedImport(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleReplaceConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Replace All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
