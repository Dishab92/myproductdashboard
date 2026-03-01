import { useMemo } from "react";
import { format } from "date-fns";

const MOTIVATIONAL_LINES = [
  "May your adoption curves go up and your latency go down.",
  "Another day, another metric to optimize.",
  "Ship fast, measure faster.",
  "Let's turn insights into impact.",
  "Your dashboards are loading faster than a sprint planning meeting that ends on time.",
];

interface GreetingHeaderProps {
  lastUpload: Date | null;
}

export function GreetingHeader({ lastUpload }: GreetingHeaderProps) {
  const motivationalLine = useMemo(
    () => MOTIVATIONAL_LINES[Math.floor(Math.random() * MOTIVATIONAL_LINES.length)],
    []
  );

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-extrabold text-gradient-cyan">
        Hi Disha! Hope you're having a great day.
      </h1>
      <p className="text-sm text-muted-foreground italic">{motivationalLine}</p>
      {lastUpload && (
        <p className="text-xs text-muted-foreground/60">
          Last updated: {format(lastUpload, "MMM d, yyyy 'at' h:mm a")}
        </p>
      )}
    </div>
  );
}
