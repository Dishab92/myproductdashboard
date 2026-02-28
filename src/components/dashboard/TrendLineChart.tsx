import { DailyMetric } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  data: DailyMetric[];
  lines?: { key: keyof DailyMetric; color: string; label: string }[];
}

const defaultLines: Props["lines"] = [
  { key: "adoptionScore", color: "hsl(173, 58%, 39%)", label: "Adoption Score" },
  { key: "activeUsers", color: "hsl(220, 70%, 55%)", label: "Active Users" },
];

export function TrendLineChart({ data, lines = defaultLines }: Props) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(220, 10%, 46%)" }}
            tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(220, 13%, 91%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          />
          {lines.map(l => (
            <Line
              key={String(l.key)}
              type="monotone"
              dataKey={String(l.key)}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              name={l.label}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
