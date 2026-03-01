

# AI Insight Summary + Personalized Greeting

Add a personalized greeting header and a rule-based AI Insight Engine to the Portfolio Overview page, generating 3-5 concise insights from existing metrics.

---

## 1. Create Insight Engine (`src/lib/insight-engine.ts`)

Pure function `generateInsights(metrics, riskAssessments, cohortData)` that applies rules against the existing computed data:

| Rule | Priority | Trigger |
|------|----------|---------|
| Risk score > 50 for any customer | High | Risk narrative (prioritized first) |
| Adoption increase > 15% WoW (any customer) | Growth | Growth insight |
| Active users drop > 30% WoW | High | Risk narrative |
| Only 1 module used consistently (single_module trigger) | Optimization | Breadth limitation |
| Cohort plateau after Week 2 | Optimization | Onboarding insight |

Each insight is an object:
```text
{
  id: string
  title: string
  explanation: string (1-2 sentences)
  confidence: "High" | "Medium" | "Low"
  priority: "high" | "growth" | "optimization"
  details: { label, value }[] (expandable metric details)
}
```

The function returns 3-5 insights, ordered: high priority first, then growth, then optimization. Deduplicates and caps at 5.

---

## 2. Create Greeting Component (`src/components/dashboard/GreetingHeader.tsx`)

- Displays "Hi Disha! Hope you're having a great day."
- Below: one rotating motivational line from the 5 provided, selected randomly on mount (using `useMemo` with empty deps)
- Clean, minimal styling: large greeting text with `text-gradient-cyan`, smaller motivational text in `text-muted-foreground`
- Includes timestamp: "Last updated: [date]"

---

## 3. Create Insight Panel Component (`src/components/dashboard/InsightPanel.tsx`)

- Renders the list of insights as cards inside a section titled "Product Intelligence"
- Each insight card shows:
  - Priority icon (AlertTriangle for high, TrendingUp for growth, Lightbulb for optimization)
  - Confidence badge (pill label: High/Medium/Low)
  - Title (bold)
  - 1-2 sentence explanation
  - Expand button (Collapsible) to reveal metric detail rows
- Uses existing glass card styling (`glass-strong`, `border-glow-cyan`)
- Snapshot Mode: all insight cards auto-expand when `isSnapshotMode` is true, timestamp visible

---

## 4. Update Portfolio Overview Page (`src/pages/Index.tsx`)

- Import and render `GreetingHeader` at the top (before the existing page title)
- Compute `riskAssessments` using existing `computeRiskAssessments` (already available in risk-calculations.ts)
- Compute `cohortData` using existing `computeCohortData`
- Call `generateInsights(metrics, riskAssessments, cohortData)` via `useMemo`
- Render `InsightPanel` between the greeting and the KPI cards section
- In Snapshot Mode, insights are included (always visible)

---

## 5. Add Metric Definitions (`src/lib/metric-definitions.ts`)

Add entry for `ai_insights`:
- Name: "AI Product Intelligence"
- Definition: "Rule-based insights generated from adoption, risk, and cohort data"
- Formula: "Applies threshold rules across metrics to surface actionable patterns"

---

## Files

| Action | File |
|--------|------|
| Create | `src/lib/insight-engine.ts` |
| Create | `src/components/dashboard/GreetingHeader.tsx` |
| Create | `src/components/dashboard/InsightPanel.tsx` |
| Modify | `src/pages/Index.tsx` |
| Modify | `src/lib/metric-definitions.ts` |

No new dependencies. Uses existing risk-calculations, cohort data, and Collapsible component.

