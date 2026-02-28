import { HealthStatus } from "@/lib/types";
import { Shield } from "lucide-react";

const config: Record<HealthStatus, { label: string; className: string }> = {
  green: { label: "Healthy", className: "text-health-green bg-health-green-bg" },
  amber: { label: "At Risk", className: "text-health-amber bg-health-amber-bg" },
  red: { label: "Critical", className: "text-health-red bg-health-red-bg" },
};

export function HealthBadge({ status, size = "sm" }: { status: HealthStatus; size?: "sm" | "md" }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${c.className} ${
      size === "md" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5"
    }`}>
      <Shield className={size === "md" ? "w-3.5 h-3.5" : "w-3 h-3"} />
      {c.label}
    </span>
  );
}
