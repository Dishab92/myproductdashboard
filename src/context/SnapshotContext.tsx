import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";
import html2canvas from "html2canvas";

interface SnapshotOptions {
  includeDefinitions: boolean;
  includeFilters: boolean;
  includeAlerts: boolean;
}

interface SnapshotState {
  isSnapshotMode: boolean;
  toggleSnapshot: () => void;
  options: SnapshotOptions;
  setOption: (key: keyof SnapshotOptions, val: boolean) => void;
  exportPNG: () => Promise<void>;
  contentRef: React.RefObject<HTMLDivElement>;
}

const SnapshotContext = createContext<SnapshotState>({
  isSnapshotMode: false,
  toggleSnapshot: () => {},
  options: { includeDefinitions: true, includeFilters: true, includeAlerts: true },
  setOption: () => {},
  exportPNG: async () => {},
  contentRef: { current: null },
});

export const useSnapshot = () => useContext(SnapshotContext);

export function SnapshotProvider({ children }: { children: ReactNode }) {
  const [isSnapshotMode, setIsSnapshotMode] = useState(false);
  const [options, setOptions] = useState<SnapshotOptions>({
    includeDefinitions: true,
    includeFilters: true,
    includeAlerts: true,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  const toggleSnapshot = useCallback(() => setIsSnapshotMode(p => !p), []);

  const setOption = useCallback((key: keyof SnapshotOptions, val: boolean) => {
    setOptions(prev => ({ ...prev, [key]: val }));
  }, []);

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
    <SnapshotContext.Provider value={{ isSnapshotMode, toggleSnapshot, options, setOption, exportPNG, contentRef }}>
      {children}
    </SnapshotContext.Provider>
  );
}
