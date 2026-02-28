import { EventRecord, CustomerRecord, ScoreRecord, AgentAdoptionRecord } from "./types";

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
