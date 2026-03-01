import { CohortRow } from "@/lib/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COHORT_COLORS = [
  "hsl(var(--primary))",
  "hsl(280, 70%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(142, 71%, 45%)",
  "hsl(0, 72%, 55%)",
  "hsl(200, 70%, 55%)",
];

export function RetentionChart({ data }: { data: CohortRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No retention data available.</p>;
  }

  // Transform: each row is a week with one key per cohort
  const weeks = Array.from({ length: 13 }, (_, i) => i);
  const chartData = weeks.map(w => {
    const point: Record<string, number | string> = { week: `W${w}` };
    for (const cohort of data) {
      const weekData = cohort.weeks.find(wk => wk.week === w);
      point[cohort.cohortLabel] = weekData?.activeUsersPct ?? 0;
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--muted-foreground), 0.15)" />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 120]} unit="%" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 11,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {data.map((cohort, i) => (
          <Line
            key={cohort.cohortLabel}
            type="monotone"
            dataKey={cohort.cohortLabel}
            stroke={COHORT_COLORS[i % COHORT_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
