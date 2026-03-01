import { EventRecord, CustomerRecord, ScoreRecord, AgentAdoptionRecord, TenantConfig } from "./types";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] || ""; });
    return row;
  });
}

function normalizeInteractionType(type: string): string {
  const lower = type.toLowerCase().trim();
  if (lower === "click") return "user_action";
  if (lower === "page view" || lower === "pageview") return "page_view";
  if (lower === "response_time") return "system_latency";
  return lower;
}

function buildMetadataJson(row: Record<string, string>): string | undefined {
  const meta: Record<string, unknown> = {};
  if (row.uid) meta.client_uid = row.uid;
  if (row.feature_name) meta.sub_feature = row.feature_name;
  if (row.metric) {
    try {
      const parsed = JSON.parse(row.metric);
      if (parsed.response_time != null) meta.response_time_ms = parseInt(parsed.response_time);
      if (parsed.api_status != null) meta.api_status = parseInt(parsed.api_status);
    } catch {
      // metric not JSON, store raw
      meta.metric_raw = row.metric;
    }
  }
  return Object.keys(meta).length > 0 ? JSON.stringify(meta) : undefined;
}

function isAgentHelperFormat(headers: string[]): boolean {
  const required = ["feature_category", "feature_name", "interaction_type", "tenant_id"];
  return required.every(h => headers.includes(h));
}

export interface DetectedParseResult {
  events: EventRecord[];
  errors: string[];
  total: number;
  detectedFormat: "agent_helper" | "standard";
}

export function detectAndParseEventsCSV(text: string, tenantConfig?: TenantConfig[]): DetectedParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { events: [], errors: ["Empty file"], total: 0, detectedFormat: "standard" };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_"));

  if (isAgentHelperFormat(headers)) {
    return parseAgentHelperFormat(text, headers, tenantConfig);
  }

  const std = parseEventsCSV(text);
  return { ...std, detectedFormat: "standard" };
}

function parseAgentHelperFormat(text: string, _headers: string[], tenantConfig?: TenantConfig[]): DetectedParseResult {
  const rows = parseCSV(text);
  const errors: string[] = [];
  const seen = new Set<string>();
  const events: EventRecord[] = [];
  let invalidDates = 0;

  const configMap = new Map<string, TenantConfig>();
  tenantConfig?.forEach(c => configMap.set(c.tenant_id, c));

  for (const row of rows) {
    const dt = new Date(row.ts);
    if (isNaN(dt.getTime())) { invalidDates++; continue; }

    const tenantId = row.tenant_id || "";
    const userId = row.user_id || "";
    const featureCategory = row.feature_category || "";
    const featureName = row.feature_name || "";
    const interactionType = normalizeInteractionType(row.interaction_type || "");

    const eventName = `${interactionType}:${featureCategory}:${featureName}`;
    const dateStr = dt.toISOString().slice(0, 10).replace(/-/g, "");
    const sessionId = `${userId}-${dateStr}`;

    const key = `${row.ts}-${userId}-${eventName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const config = configMap.get(tenantId);
    const customerName = config?.customer_name || tenantId;

    events.push({
      event_time: dt,
      customer_id: tenantId,
      customer_name: customerName,
      product: "Agent Helper",
      user_id: userId,
      session_id: sessionId,
      event_name: eventName,
      feature: featureCategory,
      case_id: row.case_number || undefined,
      metadata_json: buildMetadataJson(row),
    });
  }

  if (invalidDates > 0) errors.push(`${invalidDates} rows with unparseable timestamps skipped`);

  return { events, errors, total: rows.length, detectedFormat: "agent_helper" };
}

export function parseEventsCSV(text: string): { events: EventRecord[]; errors: string[]; total: number } {
  const rows = parseCSV(text);
  const errors: string[] = [];
  const required = ["event_time", "customer_id", "customer_name", "product", "user_id", "session_id", "event_name", "feature"];
  
  if (rows.length === 0) return { events: [], errors: ["Empty file"], total: 0 };
  
  const firstRow = rows[0];
  const missing = required.filter(col => !(col in firstRow));
  if (missing.length > 0) {
    errors.push(`Missing columns: ${missing.join(", ")}`);
    return { events: [], errors, total: rows.length };
  }

  const seen = new Set<string>();
  const events: EventRecord[] = [];
  let invalidCount = 0;

  for (const row of rows) {
    const key = `${row.event_time}-${row.user_id}-${row.event_name}-${row.session_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const dt = new Date(row.event_time);
    if (isNaN(dt.getTime())) { invalidCount++; continue; }
    
    const product = row.product?.trim();
    if (product !== "Agent Helper" && product !== "Case QA") { invalidCount++; continue; }

    events.push({
      event_time: dt,
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      product: product as "Agent Helper" | "Case QA",
      user_id: row.user_id,
      session_id: row.session_id,
      event_name: row.event_name,
      feature: row.feature,
      case_id: row.case_id || undefined,
      channel: row.channel || undefined,
      metadata_json: row.metadata_json || undefined,
    });
  }

  if (invalidCount > 0) errors.push(`${invalidCount} invalid rows skipped`);
  return { events, errors, total: rows.length };
}

export function parseCustomersCSV(text: string): { customers: CustomerRecord[]; errors: string[] } {
  const rows = parseCSV(text);
  const errors: string[] = [];
  const required = ["customer_id", "customer_name"];
  
  if (rows.length > 0) {
    const missing = required.filter(col => !(col in rows[0]));
    if (missing.length > 0) {
      errors.push(`Missing columns: ${missing.join(", ")}`);
      return { customers: [], errors };
    }
  }

  const customers: CustomerRecord[] = rows.map(row => ({
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    release: row.release || "Unknown",
    go_live_date: row.go_live_date ? new Date(row.go_live_date) : new Date(),
    licensed_users: parseInt(row.licensed_users) || 0,
    cs_owner: row.cs_owner || "",
  }));

  return { customers, errors };
}

export function parseScoresCSV(text: string): { scores: ScoreRecord[]; errors: string[] } {
  const rows = parseCSV(text);
  const errors: string[] = [];
  const required = ["event_time", "customer_id", "case_id", "score_overall", "grade"];
  
  if (rows.length > 0) {
    const missing = required.filter(col => !(col in rows[0]));
    if (missing.length > 0) {
      errors.push(`Missing columns: ${missing.join(", ")}`);
      return { scores: [], errors };
    }
  }

  const scores: ScoreRecord[] = rows.map(row => ({
    event_time: new Date(row.event_time),
    customer_id: row.customer_id,
    case_id: row.case_id,
    score_overall: parseFloat(row.score_overall) || 0,
    grade: row.grade,
    parameters_json: row.parameters_json || undefined,
  }));

  return { scores, errors };
}

export function parseAgentAdoptionCSV(text: string, customerName: string): { records: AgentAdoptionRecord[]; errors: string[] } {
  const rows = parseCSV(text);
  const errors: string[] = [];
  const required = ["date", "agent_name", "feature_used", "usage_count"];

  if (rows.length === 0) return { records: [], errors: ["Empty file"] };

  const firstRow = rows[0];
  const missing = required.filter(col => !(col in firstRow));
  if (missing.length > 0) {
    errors.push(`Missing columns: ${missing.join(", ")}`);
    return { records: [], errors };
  }

  const seen = new Set<string>();
  const records: AgentAdoptionRecord[] = [];

  for (const row of rows) {
    // Parse DD-MM-YYYY format
    const parts = row.date?.split("-");
    let dt: Date;
    if (parts && parts.length === 3) {
      dt = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      dt = new Date(row.date);
    }
    if (isNaN(dt.getTime())) continue;

    const key = `${row.date}-${row.agent_name}-${row.feature_used}`;
    if (seen.has(key)) continue;
    seen.add(key);

    records.push({
      date: dt,
      agentName: row.agent_name,
      featureUsed: row.feature_used,
      usageCount: parseInt(row.usage_count) || 0,
      customerName,
    });
  }

  return { records, errors };
}
