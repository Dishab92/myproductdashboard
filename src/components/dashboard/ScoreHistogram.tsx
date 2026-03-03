import { ScoreRecord } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Props {
  scores: ScoreRecord[];
}

const GRADE_COLORS: Record<string, string> = {
  A: "hsl(152, 60%, 42%)",
  B: "hsl(173, 58%, 39%)",
  C: "hsl(38, 92%, 50%)",
  D: "hsl(20, 80%, 50%)",
  F: "hsl(0, 72%, 51%)",
};

export function ScoreHistogram({ scores }: Props) {
  // Build histogram buckets
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 9}`,
    count: 0,
  }));
  for (const s of scores) {
    const idx = Math.min(Math.floor(s.score_overall / 10), 9);
    buckets[idx].count++;
  }

  // Grade distribution
  const gradeMap = new Map<string, number>();
  for (const s of scores) {
    gradeMap.set(s.grade, (gradeMap.get(s.grade) || 0) + 1);
  }
  const gradeData = Array.from(gradeMap.entries())
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => a.grade.localeCompare(b.grade));

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Score Distribution</h4>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets}>
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--card-foreground))" }} />
              <Bar dataKey="count" fill="hsl(173, 58%, 39%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Grade Distribution</h4>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gradeData}
                dataKey="count"
                nameKey="grade"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ grade, percent }) => `${grade} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
                fontSize={11}
              >
                {gradeData.map(d => (
                  <Cell key={d.grade} fill={GRADE_COLORS[d.grade] || "hsl(220, 10%, 60%)"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--card-foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
