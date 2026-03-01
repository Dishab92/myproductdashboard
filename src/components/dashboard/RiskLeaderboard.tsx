import { useState } from "react";
import { RiskAssessment } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { HealthBadge } from "./HealthBadge";
import { TrendBadge } from "./TrendBadge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, AlertTriangle, Lightbulb } from "lucide-react";
import { useSnapshot } from "@/context/SnapshotContext";

export function RiskLeaderboard({ assessments }: { assessments: RiskAssessment[] }) {
  const { isSnapshotMode } = useSnapshot();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isOpen = (a: RiskAssessment) =>
    expanded.has(a.customer_id) || (isSnapshotMode && a.riskLevel === "High");

  if (assessments.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No risk data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-6" />
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Customer</th>
            <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Risk Score</th>
            <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Risk Level</th>
            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Primary Trigger</th>
            <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Momentum</th>
            <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Health</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map(a => (
            <Collapsible key={a.customer_id} open={isOpen(a)} onOpenChange={() => toggle(a.customer_id)} asChild>
              <>
                <CollapsibleTrigger asChild>
                  <tr className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors">
                    <td className="px-3 py-2">
                      {isOpen(a) ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">{a.customer_name}</td>
                    <td className="px-3 py-2 text-center font-bold text-foreground">{a.riskScore}</td>
                    <td className="px-3 py-2 text-center"><RiskBadge level={a.riskLevel} /></td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{a.triggers[0]?.description || "—"}</td>
                    <td className="px-3 py-2 text-center"><TrendBadge value={a.momentum} /></td>
                    <td className="px-3 py-2 text-center"><HealthBadge status={a.health} /></td>
                  </tr>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Risk Breakdown */}
                        <div>
                          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                            Risk Breakdown
                          </h4>
                          {a.triggers.length > 0 ? (
                            <div className="space-y-2">
                              {a.triggers.map((t, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="flex-shrink-0 w-16">
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className="h-full rounded-full"
                                        style={{
                                          width: `${Math.min((t.points / 30) * 100, 100)}%`,
                                          backgroundColor: t.points >= 25 ? "hsl(0, 72%, 51%)" : t.points >= 15 ? "hsl(45, 93%, 47%)" : "hsl(142, 71%, 45%)",
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-xs font-mono text-muted-foreground">+{t.points}</span>
                                  <span className="text-xs text-foreground">{t.description}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No risk triggers detected.</p>
                          )}
                        </div>
                        {/* Suggested Actions */}
                        <div>
                          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-primary" />
                            Suggested Actions
                          </h4>
                          {a.suggestedActions.length > 0 ? (
                            <ul className="space-y-1">
                              {a.suggestedActions.map((action, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-primary mt-0.5">•</span>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground">No actions required.</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </CollapsibleContent>
              </>
            </Collapsible>
          ))}
        </tbody>
      </table>
    </div>
  );
}
