import { ReactNode } from "react";
import { TrendBadge } from "./TrendBadge";
import { MetricInfoCard } from "./MetricInfoCard";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: ReactNode;
  tooltip?: string;
  metricId?: string;
}

export function KPICard({ title, value, subtitle, trend, icon, tooltip, metricId }: KPICardProps) {
  return (
    <div className="glass-strong rounded-lg p-5 border-glow-cyan shimmer-border group hover:scale-[1.02] transition-all duration-300"
         style={{ boxShadow: '0 0 0 0 hsla(var(--primary), 0)' }}
         onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 25px hsla(var(--primary), 0.15), 0 8px 32px hsla(0,0%,0%,0.3)')}
         onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 hsla(var(--primary), 0)')}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            {metricId && <MetricInfoCard metricId={metricId} />}
          </div>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && (
            <div className="p-2 rounded-lg" style={{ background: 'hsla(var(--primary), 0.08)' }}>
              <div className="text-primary">{icon}</div>
            </div>
          )}
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
      </div>
    </div>
  );
}
