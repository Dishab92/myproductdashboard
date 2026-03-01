import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppData, EventRecord, CustomerRecord, ScoreRecord, AgentAdoptionRecord, DateRange, TenantConfig } from "@/lib/types";
import { generateMockEvents, generateMockCustomers, generateMockScores } from "@/lib/mock-data";

interface DataContextType {
  data: AppData;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  productFilter: string;
  setProductFilter: (p: string) => void;
  releaseFilter: string;
  setReleaseFilter: (r: string) => void;
  setEvents: (events: EventRecord[]) => void;
  setCustomers: (customers: CustomerRecord[]) => void;
  setScores: (scores: ScoreRecord[]) => void;
  setAgentAdoption: (records: AgentAdoptionRecord[]) => void;
  setTenantConfig: (config: TenantConfig[]) => void;
  hasData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function getDefaultDateRange(days: number, label: string): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to, label };
}

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

function applyTenantConfig(events: EventRecord[], config: TenantConfig[]): EventRecord[] {
  if (config.length === 0) return events;
  const map = new Map(config.map(c => [c.tenant_id, c.customer_name]));
  return events.map(e => {
    const name = map.get(e.customer_id);
    return name ? { ...e, customer_name: name } : e;
  });
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

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    events: [],
    customers: [],
    scores: [],
    agentAdoption: [],
    tenantConfig: loadTenantConfig(),
    lastUpload: null,
  });
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange(30, "30 Days"));
  const [productFilter, setProductFilter] = useState("All");
  const [releaseFilter, setReleaseFilter] = useState("All");

  // Load mock data on mount
  useEffect(() => {
    const events = generateMockEvents();
    const customers = generateMockCustomers();
    const scores = generateMockScores();
    setData(prev => ({ ...prev, events, customers, scores, lastUpload: new Date() }));
  }, []);

  const hasData = data.events.length > 0;

  const handleSetTenantConfig = (config: TenantConfig[]) => {
    saveTenantConfig(config);
    setData(prev => {
      const updatedEvents = applyTenantConfig(prev.events, config);
      const configCustomers = generateCustomersFromConfig(config);
      // Merge: keep non-config customers, add config ones
      const configIds = new Set(config.map(c => c.tenant_id));
      const existingCustomers = prev.customers.filter(c => !configIds.has(c.customer_id));
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
        setEvents: (events) => {
          setData(prev => ({
            ...prev,
            events: applyTenantConfig(events, prev.tenantConfig),
            lastUpload: new Date(),
          }));
        },
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
        hasData,
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
