import { HealthStatus } from "@/lib/types";
import { Shield } from "lucide-react";

const config: Record<HealthStatus, { label: string; textClass: string; bgClass: string; glow?: boolean }> = {
  green: { label: "Healthy", textClass: "text-health-green", bgClass: "bg-health-green" },
  amber: { label: "At Risk", textClass: "text-health-amber", bgClass: "bg-health-amber" },
  red: { label: "Critical", textClass: "text-health-red", bgClass: "bg-health-red", glow: true },
};

export function HealthBadge({ status, size = "sm" }: { status: HealthStatus; size?: "sm" | "md" }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${c.textClass} ${c.bgClass} ${
      size === "md" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5"
    } ${c.glow ? "animate-glow-pulse" : ""}`}>
      <Shield className={size === "md" ? "w-3.5 h-3.5" : "w-3 h-3"} />
      {c.label}
    </span>
  );
}
