import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppData, EventRecord, CustomerRecord, ScoreRecord, DateRange } from "@/lib/types";
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
  hasData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function getDefaultDateRange(days: number, label: string): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to, label };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    events: [],
    customers: [],
    scores: [],
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
    setData({ events, customers, scores, lastUpload: new Date() });
  }, []);

  const hasData = data.events.length > 0;

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
        setEvents: (events) => setData(prev => ({ ...prev, events, lastUpload: new Date() })),
        setCustomers: (customers) => setData(prev => ({ ...prev, customers })),
        setScores: (scores) => setData(prev => ({ ...prev, scores })),
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
