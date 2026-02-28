import { useSnapshot } from "@/context/SnapshotContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function SnapshotToolbar() {
  const { options, setOption, exportPNG } = useSnapshot();

  return (
    <div className="flex items-center gap-4 px-4 py-2 glass-strong border-b border-primary/20 text-xs">
      <span className="font-semibold text-primary uppercase tracking-wider">Snapshot Mode</span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Definitions</span>
        <Switch
          checked={options.includeDefinitions}
          onCheckedChange={v => setOption("includeDefinitions", v)}
          className="scale-75"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Filters</span>
        <Switch
          checked={options.includeFilters}
          onCheckedChange={v => setOption("includeFilters", v)}
          className="scale-75"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Alerts</span>
        <Switch
          checked={options.includeAlerts}
          onCheckedChange={v => setOption("includeAlerts", v)}
          className="scale-75"
        />
      </div>
      <div className="ml-auto">
        <Button size="sm" className="h-7 text-xs gap-1.5" onClick={exportPNG}
          style={{ background: 'linear-gradient(135deg, hsl(195 100% 50%), hsl(220 80% 55%))' }}>
          <Download className="w-3.5 h-3.5" />
          Export PNG
        </Button>
      </div>
    </div>
  );
}
