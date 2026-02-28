import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DATE_PRESETS = [
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
  { label: "6 Months", days: 180 },
];

export function FilterBar() {
  const { dateRange, setDateRange, productFilter, setProductFilter, releaseFilter, setReleaseFilter } = useData();

  const handleDatePreset = (days: number, label: string) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateRange({ from, to, label });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
        {DATE_PRESETS.map(p => (
          <Button
            key={p.days}
            size="sm"
            variant={dateRange.label === p.label ? "default" : "ghost"}
            className="h-7 text-xs px-3"
            onClick={() => handleDatePreset(p.days, p.label)}
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

      <Select value={releaseFilter} onValueChange={setReleaseFilter}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Release" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Releases</SelectItem>
          <SelectItem value="Q2:2024">Q2:2024</SelectItem>
          <SelectItem value="Q3:2024">Q3:2024</SelectItem>
          <SelectItem value="Q4:2024">Q4:2024</SelectItem>
          <SelectItem value="Q1:2025">Q1:2025</SelectItem>
          <SelectItem value="Q2:2025">Q2:2025</SelectItem>
          <SelectItem value="Q3:2025">Q3:2025</SelectItem>
          <SelectItem value="Yet to Go-Live">Yet to Go-Live</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
