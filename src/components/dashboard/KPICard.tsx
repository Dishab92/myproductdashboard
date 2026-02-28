import { ReactNode } from "react";
import { TrendBadge } from "./TrendBadge";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: ReactNode;
  tooltip?: string;
}

export function KPICard({ title, value, subtitle, trend, icon, tooltip }: KPICardProps) {
  return (
    <div className="glass-strong rounded-lg p-5 border-glow-cyan shimmer-border group hover:scale-[1.02] transition-all duration-300"
         style={{ boxShadow: '0 0 0 0 hsla(195, 100%, 50%, 0)' }}
         onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 25px hsla(195, 100%, 50%, 0.15), 0 8px 32px hsla(0,0%,0%,0.3)')}
         onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 hsla(195, 100%, 50%, 0)')}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            {tooltip && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs glass-strong">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-2xl font-bold text-card-foreground"
             style={{ textShadow: '0 0 12px hsla(195, 100%, 50%, 0.2)' }}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && (
            <div className="p-2 rounded-lg" style={{ background: 'hsla(195, 100%, 50%, 0.08)' }}>
              <div className="text-primary">{icon}</div>
            </div>
          )}
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
      </div>
    </div>
  );
}
