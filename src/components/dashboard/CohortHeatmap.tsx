import { CohortRow } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function scoreColor(score: number): string {
  if (score >= 70) return "hsl(142, 71%, 35%)";
  if (score >= 40) return "hsl(45, 93%, 47%)";
  return "hsl(0, 72%, 51%)";
}

function scoreBg(score: number): string {
  if (score >= 70) return "hsla(142, 71%, 35%, 0.2)";
  if (score >= 40) return "hsla(45, 93%, 47%, 0.2)";
  return "hsla(0, 72%, 51%, 0.2)";
}

export function CohortHeatmap({ data }: { data: CohortRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No cohort data available.</p>;
  }

  const weeks = Array.from({ length: 13 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left px-2 py-1.5 text-muted-foreground font-medium">Cohort</th>
            {weeks.map(w => (
              <th key={w} className="px-1.5 py-1.5 text-center text-muted-foreground font-medium min-w-[40px]">
                W{w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.cohortLabel}>
              <td className="px-2 py-1 font-medium text-foreground whitespace-nowrap">{row.cohortLabel}</td>
              {weeks.map(w => {
                const weekData = row.weeks.find(wk => wk.week === w);
                const score = weekData?.score ?? 0;
                return (
                  <td key={w} className="px-0.5 py-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="w-full h-7 rounded flex items-center justify-center text-[10px] font-bold cursor-default transition-transform hover:scale-110"
                          style={{
                            backgroundColor: weekData ? scoreBg(score) : "hsla(0,0%,50%,0.05)",
                            color: weekData ? scoreColor(score) : "hsl(var(--muted-foreground))",
                            border: weekData ? `1px solid ${scoreColor(score)}40` : "1px solid transparent",
                          }}
                        >
                          {weekData ? score : "–"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        <p>{row.cohortLabel} · Week {w}</p>
                        <p className="font-bold">Adoption Score: {weekData ? score : "N/A"}</p>
                        {weekData && <p>Active Users: {weekData.activeUsersPct}%</p>}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
