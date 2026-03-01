import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { AppData, EventRecord, CustomerRecord, ScoreRecord, AgentAdoptionRecord, DateRange, TenantConfig } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface DataContextType {
  data: AppData;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  productFilter: string;
  setProductFilter: (p: string) => void;
  releaseFilter: string;
  setReleaseFilter: (r: string) => void;
  setCustomers: (customers: CustomerRecord[]) => void;
  setScores: (scores: ScoreRecord[]) => void;
  setAgentAdoption: (records: AgentAdoptionRecord[]) => void;
  setTenantConfig: (config: TenantConfig[]) => void;
  appendEvents: (events: EventRecord[], meta: DatasetMeta) => Promise<UploadSummary>;
  replaceEvents: (events: EventRecord[], meta: DatasetMeta) => Promise<UploadSummary>;
  refreshEvents: () => Promise<void>;
  hasData: boolean;
  isLoading: boolean;
}

export interface DatasetMeta {
  fileName: string;
  detectedFormat: string;
}

export interface UploadSummary {
  processed: number;
  inserted: number;
  duplicatesSkipped: number;
  error?: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CHUNK_SIZE = 500;

function loadTenantConfig(): TenantConfig[] {
  try {
    const stored = localStorage.getItem("pm_tenant_config");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((c: any) => ({
        ...c,
        go_live_date: c.go_live_date ? new Date(c.go_live_date) : null,
      }));
    }
  } catch {}
  return [];
}

function saveTenantConfig(config: TenantConfig[]) {
  localStorage.setItem("pm_tenant_config", JSON.stringify(config));
}

function generateCustomersFromConfig(config: TenantConfig[]): CustomerRecord[] {
  return config
    .filter(c => c.customer_name)
    .map(c => ({
      customer_id: c.tenant_id,
      customer_name: c.customer_name,
      release: c.stage || "Unknown",
      go_live_date: c.go_live_date || new Date(),
      licensed_users: 0,
      cs_owner: "",
    }));
}

function dbRowToEvent(row: any): EventRecord {
  return {
    event_time: new Date(row.event_time),
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    product: row.product as "Agent Helper" | "Case QA",
    user_id: row.user_id,
    session_id: row.session_id,
    event_name: row.event_name,
    feature: row.feature,
    case_id: row.case_id || undefined,
    channel: row.channel || undefined,
    metadata_json: row.metadata_json || undefined,
    event_key: row.event_key,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>({
    events: [],
    customers: [],
    scores: [],
    agentAdoption: [],
    tenantConfig: loadTenantConfig(),
    lastUpload: null,
  });
  const [dateRange, setDateRange] = useState<DateRange>({ from: new Date(), to: new Date(), label: "No Data" });
  const [productFilter, setProductFilter] = useState("All");
  const [releaseFilter, setReleaseFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(false);

  const hasData = data.events.length > 0;

  const computeDateRange = (events: EventRecord[]) => {
    if (events.length === 0) {
      setDateRange({ from: new Date(), to: new Date(), label: "No Data" });
      return;
    }
    const sorted = [...events].sort((a, b) => a.event_time.getTime() - b.event_time.getTime());
    setDateRange({ from: sorted[0].event_time, to: sorted[sorted.length - 1].event_time, label: "All Data" });
  };

  // Load events from DB on mount / user change
  const loadEventsFromDB = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Supabase has 1000 row default limit — paginate
      let allRows: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data: rows, error } = await supabase
          .from("events")
          .select("*")
          .eq("owner_id", user.id)
          .order("event_time", { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) { console.error("[DataContext] Load error:", error); break; }
        if (!rows || rows.length === 0) break;
        allRows = allRows.concat(rows);
        if (rows.length < pageSize) break;
        from += pageSize;
      }

      const events = allRows.map(dbRowToEvent);
      console.log(`[DataContext] Loaded ${events.length} events from DB`);

      setData(prev => ({
        ...prev,
        events,
        customers: generateCustomersFromConfig(prev.tenantConfig),
        lastUpload: events.length > 0 ? new Date() : null,
      }));
      computeDateRange(events);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEventsFromDB();
  }, [loadEventsFromDB]);

  const refreshEvents = useCallback(async () => {
    await loadEventsFromDB();
  }, [loadEventsFromDB]);

  // Append: insert only new (non-duplicate) events
  const appendEvents = useCallback(async (events: EventRecord[], meta: DatasetMeta): Promise<UploadSummary> => {
    if (!user) return { processed: 0, inserted: 0, duplicatesSkipped: 0, error: "Not authenticated" };

    const sorted = [...events].sort((a, b) => a.event_time.getTime() - b.event_time.getTime());
    const dateMin = sorted[0]?.event_time || new Date();
    const dateMax = sorted[sorted.length - 1]?.event_time || new Date();

    // Create dataset record
    const { data: ds, error: dsErr } = await supabase.from("datasets").insert({
      file_name: meta.fileName,
      detected_format: meta.detectedFormat,
      row_count: events.length,
      date_min: dateMin.toISOString(),
      date_max: dateMax.toISOString(),
      mode: "append",
      owner_id: user.id,
    }).select("id").single();

    if (dsErr || !ds) return { processed: events.length, inserted: 0, duplicatesSkipped: 0, error: dsErr?.message || "Failed to create dataset" };

    const datasetId = ds.id;

    // Build insert rows
    const insertRows = events.map(e => ({
      event_key: e.event_key || `${e.event_time.toISOString()}-${e.user_id}-${e.event_name}`,
      event_time: e.event_time.toISOString(),
      customer_id: e.customer_id,
      customer_name: e.customer_name,
      product: e.product,
      user_id: e.user_id,
      session_id: e.session_id,
      event_name: e.event_name,
      feature: e.feature,
      case_id: e.case_id || null,
      channel: e.channel || null,
      metadata_json: e.metadata_json || null,
      dataset_id: datasetId,
      owner_id: user.id,
    }));

    // Chunked upsert with ON CONFLICT skip
    let inserted = 0;
    for (let i = 0; i < insertRows.length; i += CHUNK_SIZE) {
      const chunk = insertRows.slice(i, i + CHUNK_SIZE);
      const { data: result, error } = await supabase
        .from("events")
        .upsert(chunk, { onConflict: "event_key,owner_id", ignoreDuplicates: true })
        .select("id");
      if (error) {
        console.error("[Append] Chunk error:", error);
        continue;
      }
      inserted += result?.length || 0;
    }

    // Update dataset row_count with actual inserts
    await supabase.from("datasets").update({ row_count: inserted }).eq("id", datasetId);

    // Reload from DB
    await loadEventsFromDB();

    return {
      processed: events.length,
      inserted,
      duplicatesSkipped: events.length - inserted,
    };
  }, [user, loadEventsFromDB]);

  // Replace: delete all, then insert
  const replaceEvents = useCallback(async (events: EventRecord[], meta: DatasetMeta): Promise<UploadSummary> => {
    if (!user) return { processed: 0, inserted: 0, duplicatesSkipped: 0, error: "Not authenticated" };

    // Delete all existing events for this user
    const { error: delErr } = await supabase.from("events").delete().eq("owner_id", user.id);
    if (delErr) return { processed: events.length, inserted: 0, duplicatesSkipped: 0, error: delErr.message };

    // Delete all existing datasets for this user
    await supabase.from("datasets").delete().eq("owner_id", user.id);

    // Now insert as append
    return appendEvents(events, meta);
  }, [user, appendEvents]);

  const handleSetTenantConfig = (config: TenantConfig[]) => {
    saveTenantConfig(config);
    setData(prev => {
      const configCustomers = generateCustomersFromConfig(config);
      const configIds = new Set(config.map(c => c.tenant_id));
      const existingCustomers = prev.customers.filter(c => !configIds.has(c.customer_id));
      // Apply name mapping to in-memory events
      const nameMap = new Map(config.map(c => [c.tenant_id, c.customer_name]));
      const updatedEvents = prev.events.map(e => {
        const name = nameMap.get(e.customer_id);
        return name ? { ...e, customer_name: name } : e;
      });
      return {
        ...prev,
        tenantConfig: config,
        events: updatedEvents,
        customers: [...existingCustomers, ...configCustomers],
      };
    });
  };

  return (
    <DataContext.Provider
      value={{
        data,
        dateRange,
        setDateRange,
        productFilter,
        setProductFilter,
        releaseFilter,
        setReleaseFilter,
        setCustomers: (customers) => setData(prev => ({ ...prev, customers })),
        setScores: (scores) => setData(prev => ({ ...prev, scores })),
        setAgentAdoption: (records) => setData(prev => ({
          ...prev,
          agentAdoption: [...prev.agentAdoption.filter(r => {
            const newCustomers = new Set(records.map(nr => nr.customerName));
            return !newCustomers.has(r.customerName);
          }), ...records],
        })),
        setTenantConfig: handleSetTenantConfig,
        appendEvents,
        replaceEvents,
        refreshEvents,
        hasData,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (ctx === undefined) throw new Error("useData must be used within DataProvider");
  return ctx;
}
