import { DailyMetric } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  data: DailyMetric[];
  lines?: { key: keyof DailyMetric; color: string; label: string }[];
}

const defaultLines: Props["lines"] = [
  { key: "adoptionScore", color: "hsl(195, 100%, 50%)", label: "Adoption Score" },
  { key: "activeUsers", color: "hsl(270, 100%, 65%)", label: "Active Users" },
];

export function TrendLineChart({ data, lines = defaultLines }: Props) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsla(220, 20%, 16%, 0.6)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
            tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsla(220, 30%, 8%, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid hsla(195, 100%, 50%, 0.2)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(210, 20%, 95%)",
              boxShadow: "0 0 20px hsla(195, 100%, 50%, 0.1)",
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
