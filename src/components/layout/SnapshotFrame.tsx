import { ReactNode } from "react";
import { useSnapshot } from "@/context/SnapshotContext";

export function SnapshotFrame({ children }: { children: ReactNode }) {
  const { isSnapshotMode } = useSnapshot();

  if (!isSnapshotMode) return <>{children}</>;

  return (
    <div className="relative border-2 border-primary/30 rounded-lg m-2">
      {/* Watermark */}
      <div className="absolute top-3 right-4 text-right z-20 pointer-events-none">
        <p className="text-[10px] font-semibold text-primary/60 uppercase tracking-wider">
          PM Dashboard Snapshot
        </p>
        <p className="text-[9px] text-muted-foreground/50">
          {new Date().toLocaleString()}
        </p>
      </div>
      <div className="p-1">
        {children}
      </div>
    </div>
  );
}
