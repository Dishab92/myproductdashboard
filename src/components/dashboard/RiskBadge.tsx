import { AlertTriangle } from "lucide-react";

type RiskLevel = "Low" | "Medium" | "High";

const config: Record<RiskLevel, { textClass: string; bgClass: string; glow?: boolean }> = {
  Low: { textClass: "text-health-green", bgClass: "bg-health-green" },
  Medium: { textClass: "text-health-amber", bgClass: "bg-health-amber" },
  High: { textClass: "text-health-red", bgClass: "bg-health-red", glow: true },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const c = config[level];
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full text-xs px-2 py-0.5 ${c.textClass} ${c.bgClass} ${c.glow ? "animate-glow-pulse" : ""}`}>
      <AlertTriangle className="w-3 h-3" />
      {level}
    </span>
  );
}
