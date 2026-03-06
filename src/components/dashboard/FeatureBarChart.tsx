import { FeatureUsage } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: FeatureUsage[];
  maxItems?: number;
}

const COLORS = [
  "hsl(195, 100%, 50%)",
  "hsl(270, 100%, 65%)",
  "hsl(330, 100%, 60%)",
  "hsl(220, 80%, 60%)",
  "hsl(38, 100%, 55%)",
  "hsl(195, 100%, 60%)",
  "hsl(270, 100%, 72%)",
  "hsl(330, 100%, 68%)",
  "hsl(220, 80%, 68%)",
  "hsl(38, 100%, 62%)",
];

export function FeatureBarChart({ data, maxItems = 10 }: Props) {
  const chartData = data.slice(0, maxItems);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }} />
          <YAxis
            dataKey="feature"
            type="category"
            width={110}
            tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
          />
          <Tooltip
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ zIndex: 1000 }}
            cursor={{ fill: "hsla(var(--primary), 0.08)" }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(var(--card-foreground))",
              boxShadow: "0 4px 12px hsla(0, 0%, 0%, 0.15)",
            }}
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name === "totalClicks" ? "Total Clicks" : "Unique Users"
            ]}
          />
          <Bar dataKey="totalClicks" radius={[0, 4, 4, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
