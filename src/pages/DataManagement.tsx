import { useState } from "react";
import { useData } from "@/context/DataContext";
import { UploadPanel } from "@/components/dashboard/UploadPanel";
import { TenantConfigTable } from "@/components/dashboard/TenantConfigTable";
import { CustomerMappingDialog } from "@/components/dashboard/CustomerMappingDialog";
import { detectAndParseEventsCSV, parseCustomersCSV, parseScoresCSV } from "@/lib/csv-parser";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, FileText, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const { data, setEvents, setCustomers, setScores, setTenantConfig, hasData } = useData();
  const [eventsResult, setEventsResult] = useState<UploadResult | null>(null);
  const [customersResult, setCustomersResult] = useState<UploadResult | null>(null);
  const [scoresResult, setScoresResult] = useState<UploadResult | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

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

  const handleMappingConfirm = (mapping: Record<string, string>) => {
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

    setEvents(mappedEvents);

    const customerNames = Object.values(mapping).join(", ");
    const formatLabel = pendingImport.detectedFormat === "agent_helper" ? "Agent Helper format detected. " : "";
    setEventsResult({
      success: true,
      message: `${formatLabel}Dataset replaced successfully. ${mappedEvents.length.toLocaleString()} events loaded. Customer: ${customerNames}.${
        pendingImport.errors.length > 0 ? " " + pendingImport.errors.join("; ") : ""
      }`,
      detectedFormat: pendingImport.detectedFormat,
    });

    setPendingImport(null);
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
        <p className="text-sm text-muted-foreground mt-0.5">Upload and manage your CSV data</p>
      </div>

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
                <TableRow><TableCell className="text-sm">Rows Imported</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{integrityStats.rows.toLocaleString()}</TableCell></TableRow>
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
      ) : (
        <Card className="p-5 border bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-card-foreground">No Dataset</h3>
          </div>
          <p className="text-sm text-muted-foreground">No dataset uploaded. Please upload Agent Helper CSV to view analytics.</p>
        </Card>
      )}

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
    </div>
  );
}
