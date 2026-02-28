import { FeatureUsage } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: FeatureUsage[];
  maxItems?: number;
}

const COLORS = [
  "hsl(173, 58%, 39%)",
  "hsl(220, 70%, 55%)",
  "hsl(262, 52%, 55%)",
  "hsl(38, 92%, 50%)",
  "hsl(340, 65%, 55%)",
  "hsl(173, 58%, 50%)",
  "hsl(220, 70%, 65%)",
  "hsl(262, 52%, 65%)",
  "hsl(38, 92%, 60%)",
  "hsl(340, 65%, 65%)",
];

export function FeatureBarChart({ data, maxItems = 10 }: Props) {
  const chartData = data.slice(0, maxItems);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} />
          <YAxis
            dataKey="feature"
            type="category"
            width={110}
            tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(220, 13%, 91%)",
              borderRadius: "8px",
              fontSize: "12px",
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
