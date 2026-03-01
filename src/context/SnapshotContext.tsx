import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";
import html2canvas from "html2canvas";

interface SnapshotState {
  isSnapshotMode: boolean;
  toggleSnapshot: () => void;
  exportPNG: () => Promise<void>;
  contentRef: React.RefObject<HTMLDivElement>;
}

const SnapshotContext = createContext<SnapshotState>({
  isSnapshotMode: false,
  toggleSnapshot: () => {},
  exportPNG: async () => {},
  contentRef: { current: null },
});

export const useSnapshot = () => useContext(SnapshotContext);

export function SnapshotProvider({ children }: { children: ReactNode }) {
  const [isSnapshotMode, setIsSnapshotMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleSnapshot = useCallback(() => setIsSnapshotMode(p => !p), []);

  const exportPNG = useCallback(async () => {
    if (!contentRef.current) return;
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `pm-snapshot-${new Date().toISOString().slice(0, 16)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Snapshot export failed:", err);
    }
  }, []);

  return (
    <SnapshotContext.Provider value={{ isSnapshotMode, toggleSnapshot, exportPNG, contentRef }}>
      {children}
    </SnapshotContext.Provider>
  );
}
