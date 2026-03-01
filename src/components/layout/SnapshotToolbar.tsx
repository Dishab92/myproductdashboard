import { useSnapshot } from "@/context/SnapshotContext";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function SnapshotToolbar() {
  const { exportPNG } = useSnapshot();

  return (
    <div className="flex items-center gap-4 px-4 py-2 glass-strong border-b border-primary/20 text-xs">
      <span className="font-semibold text-primary uppercase tracking-wider">Snapshot Mode</span>
      <span className="text-muted-foreground">Agent Helper · All Customers</span>
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
