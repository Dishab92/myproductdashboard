import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { TrendBadge } from "./TrendBadge";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: ReactNode;
}

export function KPICard({ title, value, subtitle, trend, icon }: KPICardProps) {
  return (
    <Card className="p-5 border border-border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && <div className="text-muted-foreground">{icon}</div>}
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
      </div>
    </Card>
  );
}
