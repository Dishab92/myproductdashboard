
# Adoption Health Page: Cohort Analysis + Risk Engine

A new "Adoption Health" page added to the sidebar with two major sections: Cohort Analysis (heatmap + retention curve) and a Risk Engine (scored leaderboard with breakdown panel and suggested actions). Fully Snapshot Mode compatible.

---

## 1. New Types (`src/lib/types.ts`)

Add these interfaces:

- `CohortRow` -- `{ cohortLabel: string; goLiveMonth: string; weeks: { week: number; score: number; activeUsersPct: number }[] }`
- `RiskAssessment` -- `{ customer_id: string; customer_name: string; riskScore: number; riskLevel: "Low" | "Medium" | "High"; triggers: RiskTrigger[]; momentum: number; health: HealthStatus; adoptionScore: number; suggestedActions: string[] }`
- `RiskTrigger` -- `{ rule: string; points: number; description: string }`

---

## 2. Risk & Cohort Calculations (`src/lib/risk-calculations.ts`)

New file with pure calculation functions:

### `computeCohortData(events, customers, dateRange)`
- Groups customers by `go_live_month` (formatted from `go_live_date`)
- For each customer, computes `week_since_go_live = floor((event_date - go_live_date) / 7)` for weeks 0-12
- Aggregates adoption score per cohort per week
- Returns `CohortRow[]` for the heatmap
- Computes active users % (vs week 0 baseline) for the retention curve

### `computeRiskAssessments(events, customers, customerMetrics, dateRange)`
Applies 5 risk rules per customer:

| Rule | Points | Detection |
|------|--------|-----------|
| No events 14 days | +30 | Check `lastActivity` vs now |
| Active Users drop >40% WoW | +25 | Compare current vs prior week distinct users |
| Only 1 module used for 4 weeks | +20 | Check distinct `product` values over trailing 4 weeks |
| p95 latency >10000ms | +15 | Parse `metadata_json` for response_time (if present) |
| Trust ratio drops >20% | +10 | Compare thumbs_up/(thumbs_up+thumbs_down) WoW |

- Risk Score = sum of triggered rule points
- Risk Level: 0-20 Low, 21-50 Medium, 51+ High
- Each trigger maps to a suggested PM/CSM action

### `getRiskSuggestedActions(triggers)`
Maps each trigger to actionable text:
- No events 14d -> "Schedule urgent check-in with CS owner"
- Active Users drop -> "Investigate onboarding gaps and run re-engagement campaign"
- Single module -> "Demo additional modules; create feature adoption plan"
- High latency -> "Escalate to engineering; review API performance"
- Trust ratio drop -> "Review AI response quality; analyze thumbs-down patterns"

---

## 3. Metric Definitions (`src/lib/metric-definitions.ts`)

Add new entries:
- `risk_score` -- "Composite risk score based on 5 weighted rules..."
- `cohort_adoption` -- "Adoption score tracked by weeks since go-live..."
- `retention_rate` -- "Percentage of active users retained vs week 0..."

---

## 4. New Page (`src/pages/AdoptionHealth.tsx`)

Layout (top to bottom):

### Header
- Title: "Adoption Health"
- Subtitle: "Cohort analysis and risk detection"
- FilterBar (hidden in snapshot if `!options.includeFilters`)

### Section A: Cohort Analysis (two cards side by side)

**Cohort Heatmap** (left card, ~60% width)
- Rows = cohort groups (by go_live_month, e.g. "Mar 2024", "Jun 2024")
- Columns = weeks 0-12 since go-live
- Cell value = average adoption score for that cohort at that week
- Color scale: green (>=70) / yellow (40-69) / red (<40)
- Built as a custom HTML table with colored cells (no heavy chart lib needed)
- `MetricInfoCard` for `cohort_adoption`

**Retention Curve** (right card, ~40% width)
- Recharts `LineChart`
- X-axis: week_since_go_live (0-12)
- Y-axis: Active Users % (relative to week 0)
- One line per cohort, color-coded
- Legend with cohort labels
- `MetricInfoCard` for `retention_rate`

### Section B: Risk Engine

**Risk KPI Cards** (3 cards)
- High Risk Customers (count, red)
- Medium Risk Customers (count, amber)
- Average Risk Score (number)

**Risk Leaderboard** (full-width table)
- Columns: Customer | Risk Score | Risk Level | Primary Trigger | Momentum | Health Badge
- Sorted by risk score descending
- Clicking a row expands an inline panel (using Collapsible) showing:
  - Risk Breakdown: each triggered rule with points and description
  - Suggested Actions: bullet list of recommended PM/CSM actions
  - Trigger severity bar (visual indicator)
- Color-coded risk level badges (similar to HealthBadge)

### Snapshot Mode Support
- All `MetricInfoCard` components pin definitions when snapshot is active
- Risk breakdown panels auto-expand for all High-risk customers
- Upload/filter elements hidden per snapshot options

---

## 5. New Components

### `src/components/dashboard/CohortHeatmap.tsx`
- Renders an HTML table grid
- Props: `data: CohortRow[]`
- Cells colored with inline styles based on score thresholds
- Tooltip on hover showing exact score value

### `src/components/dashboard/RetentionChart.tsx`
- Recharts LineChart wrapper
- Props: `data: CohortRow[]`
- One line per cohort with distinct colors

### `src/components/dashboard/RiskLeaderboard.tsx`
- Table with expandable rows (uses Radix Collapsible)
- Props: `assessments: RiskAssessment[]`
- Inline risk breakdown panel
- Suggested actions list

### `src/components/dashboard/RiskBadge.tsx`
- Similar to HealthBadge but for risk levels
- Low (green), Medium (amber), High (red with glow)

---

## 6. Navigation Updates

### `src/components/layout/DashboardLayout.tsx`
- Add nav item: `{ path: "/adoption-health", label: "Adoption Health", icon: ShieldAlert }`
- Add page title mapping

### `src/App.tsx`
- Add route: `<Route path="/adoption-health" element={<AdoptionHealth />} />`

---

## Summary of All Files

| Action | File |
|--------|------|
| Modify | `src/lib/types.ts` -- Add CohortRow, RiskAssessment, RiskTrigger interfaces |
| Create | `src/lib/risk-calculations.ts` -- Cohort + risk computation functions |
| Modify | `src/lib/metric-definitions.ts` -- Add risk_score, cohort_adoption, retention_rate definitions |
| Create | `src/pages/AdoptionHealth.tsx` -- Main page with cohort + risk sections |
| Create | `src/components/dashboard/CohortHeatmap.tsx` -- Heatmap table component |
| Create | `src/components/dashboard/RetentionChart.tsx` -- Recharts retention curve |
| Create | `src/components/dashboard/RiskLeaderboard.tsx` -- Expandable risk table |
| Create | `src/components/dashboard/RiskBadge.tsx` -- Risk level badge component |
| Modify | `src/components/layout/DashboardLayout.tsx` -- Add nav item + page title |
| Modify | `src/App.tsx` -- Add route |

No changes to existing calculation logic, CSV parsers, or data context. All new computation is in a separate `risk-calculations.ts` file.
