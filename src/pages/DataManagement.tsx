import { useState } from "react";
import { useData } from "@/context/DataContext";
import { UploadPanel } from "@/components/dashboard/UploadPanel";
import { TenantConfigTable } from "@/components/dashboard/TenantConfigTable";
import { detectAndParseEventsCSV, parseCustomersCSV, parseScoresCSV } from "@/lib/csv-parser";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UploadResult {
  success: boolean;
  message: string;
  detectedFormat?: string;
}

export default function DataManagement() {
  const { data, setEvents, setCustomers, setScores } = useData();
  const [eventsResult, setEventsResult] = useState<UploadResult | null>(null);
  const [customersResult, setCustomersResult] = useState<UploadResult | null>(null);
  const [scoresResult, setScoresResult] = useState<UploadResult | null>(null);

  const handleEventsUpload = (text: string) => {
    const result = detectAndParseEventsCSV(text, data.tenantConfig);
    if (result.errors.length > 0 && result.events.length === 0) {
      setEventsResult({ success: false, message: result.errors.join("; ") });
      return;
    }
    setEvents(result.events);
    const uniqueCustomers = new Set(result.events.map(e => e.customer_id)).size;
    const uniqueUsers = new Set(result.events.map(e => e.user_id)).size;
    const formatLabel = result.detectedFormat === "agent_helper" ? "Agent Helper format detected. " : "";
    setEventsResult({
      success: true,
      message: `${formatLabel}${result.events.length.toLocaleString()} events loaded. ${uniqueCustomers} customers, ${uniqueUsers} users.${
        result.errors.length > 0 ? " " + result.errors.join("; ") : ""
      }`,
      detectedFormat: result.detectedFormat,
    });
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

  const stats = {
    events: data.events.length,
    customers: new Set(data.events.map(e => e.customer_id)).size,
    users: new Set(data.events.map(e => e.user_id)).size,
    scores: data.scores.length,
    customerRecords: data.customers.length,
  };

  return (
    <div className="p-6 space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-bold text-foreground">Data Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload and manage your CSV data</p>
      </div>

      {/* Current data summary */}
      <Card className="p-5 border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Current Dataset</h3>
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
                <TableHead className="text-xs text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell className="text-sm">Total Events</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{stats.events.toLocaleString()}</TableCell></TableRow>
              <TableRow><TableCell className="text-sm">Unique Customers</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{stats.customers}</TableCell></TableRow>
              <TableRow><TableCell className="text-sm">Unique Users</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{stats.users}</TableCell></TableRow>
              <TableRow><TableCell className="text-sm">Customer Records</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{stats.customerRecords}</TableCell></TableRow>
              <TableRow><TableCell className="text-sm">Score Records</TableCell><TableCell className="text-sm text-right tabular-nums font-medium">{stats.scores}</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>
        {data.lastUpload && (
          <p className="text-xs text-muted-foreground mt-3">
            Last updated: {data.lastUpload.toLocaleString()}
          </p>
        )}
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
    </div>
  );
}
