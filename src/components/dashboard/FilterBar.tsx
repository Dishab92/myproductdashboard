import { useMemo } from "react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FilterBar() {
  const { data, dateRange, setDateRange, productFilter, setProductFilter, releaseFilter, setReleaseFilter } = useData();

  const { dataMin, dataMax } = useMemo(() => {
    if (data.events.length === 0) return { dataMin: null, dataMax: null };
    let min = data.events[0].event_time;
    let max = data.events[0].event_time;
    for (const e of data.events) {
      if (e.event_time < min) min = e.event_time;
      if (e.event_time > max) max = e.event_time;
    }
    return { dataMin: min, dataMax: max };
  }, [data.events]);

  const presets = useMemo(() => {
    if (!dataMin || !dataMax) return [];
    const clamp = (d: Date) => new Date(Math.max(d.getTime(), dataMin.getTime()));
    return [
      { label: "All Data", from: dataMin, to: dataMax },
      { label: "Last 7 Days", from: clamp(new Date(dataMax.getTime() - 7 * 86400000)), to: dataMax },
      { label: "Last 30 Days", from: clamp(new Date(dataMax.getTime() - 30 * 86400000)), to: dataMax },
      { label: "Last 90 Days", from: clamp(new Date(dataMax.getTime() - 90 * 86400000)), to: dataMax },
    ];
  }, [dataMin, dataMax]);

  const releaseOptions = useMemo(() => {
    const releases = new Set(data.customers.map(c => c.release).filter(Boolean));
    return Array.from(releases).sort();
  }, [data.customers]);

  if (!dataMin || !dataMax) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
        {presets.map(p => (
          <Button
            key={p.label}
            size="sm"
            variant={dateRange.label === p.label ? "default" : "ghost"}
            className="h-7 text-xs px-3"
            onClick={() => setDateRange({ from: p.from, to: p.to, label: p.label })}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <Select value={productFilter} onValueChange={setProductFilter}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Product" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Products</SelectItem>
          <SelectItem value="Agent Helper">Agent Helper</SelectItem>
          <SelectItem value="Case QA">Case QA</SelectItem>
        </SelectContent>
      </Select>

      {releaseOptions.length > 0 && (
        <Select value={releaseFilter} onValueChange={setReleaseFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Release" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Releases</SelectItem>
            {releaseOptions.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
