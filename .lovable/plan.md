

# Fix RoadmapItem Interface + Remove All `as any` Casts + Analytics Logic Reference

## Part 1: Fix RoadmapItem TypeScript Interface

### Problem
The `RoadmapItem` interface in `src/components/roadmap/RoadmapCard.tsx` marks Agent Helper fields as optional (`?`), even though the database schema defines them all with `NOT NULL` defaults. This mismatch forces `(item as any)` casts in 7 files (~40 occurrences).

### Solution
Make all Agent Helper fields required (matching the DB schema), and update `computeWeightedScore` to accept the proper type instead of `any`.

**File: `src/components/roadmap/RoadmapCard.tsx`** -- Update the interface:
```typescript
export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  product_type: string;
  category: string;
  priority: string;
  status: string;
  release_quarter: string | null;
  target_date: string | null;
  owner: string;
  customer_visibility: string;
  linked_customers: string[];
  notes: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  target_bucket: string;         // was optional
  sprint: string;                // was optional
  jira_link: string;             // was optional
  feature_type: string;          // was optional
  feature_source: string;        // was optional
  score_common_customer_ask: number;     // was optional
  score_competitor_market_research: number;
  score_seller_prospect_input: number;
  score_technical_debt: number;
  score_executive_input: number;
}
```

Also fix `PRODUCT_COLORS` and `PRIORITY_COLORS` for light mode while we're here (same dark:-prefix pattern).

**File: `src/lib/agent-helper-constants.ts`** -- Update `computeWeightedScore` signature to accept `RoadmapItem` (or a pick of score fields) instead of a loose record, and update `getScoreBreakdown` similarly. This eliminates `as any` at call sites.

### Files with `as any` removals

| File | Cast Count | Fix |
|------|-----------|-----|
| `AgentHelperTableView.tsx` | ~12 | Remove all `(item as any).status`, `.feature_type`, etc. -- use `item.status` directly |
| `AgentHelperTimelineView.tsx` | ~4 | Same direct access |
| `WeightedSheetView.tsx` | ~12 | Same direct access + fix `supabase.from()` cast |
| `RoadmapItemDialog.tsx` | ~10 | Remove `const a = item as any`, use `item.target_bucket` etc. Fix `(form as any)[d.key]` with proper typed form |
| `BulkImportDialog.tsx` | 1 | Remove `supabase.from() as any` |
| `WeightConfigDialog.tsx` | 1 | Remove `supabase.from() as any` |
| `Roadmap.tsx` (page) | 1 | Remove `supabase.from() as any` |

For `supabase.from("roadmap_items") as any` casts: Since the auto-generated types already include `roadmap_items`, these casts can be removed -- the Supabase client already knows the table schema.

For `(form as any)[d.key]` in `RoadmapItemDialog.tsx`: Define the form type explicitly with an index signature or use a typed accessor for score dimension keys.

---

## Part 2: Full Analytics Logic and Formulas Reference

Here is the complete logic and formulas powering the Performance Engine, organized by module.

### Core Adoption Metrics (`src/lib/calculations.ts`)

| Metric | Formula | Details |
|--------|---------|---------|
| **Reach** | `min(active_users / licensed_users, 1) x 100` | If `licensed_users` missing, defaults to 10. Weight: 40% |
| **Frequency** | `min(sessions_per_user / 5, 1) x 100` | `sessions_per_user = distinct_sessions / active_users`. Capped at 5 sessions. Weight: 30% |
| **Depth** | `min(distinct_features / 10, 1) x 100` | Counts distinct `feature` values. Max 10 features. Weight: 30% |
| **Adoption Score** | `round(Reach x 0.4 + Frequency x 0.3 + Depth x 0.3)` | Composite 0-100. Computed per customer per date range |
| **Momentum** | `((current_score - prev_score) / prev_score) x 100` | WoW % change. If prev = 0 and current > 0, returns 100% |
| **Health Badge** | Green: score >= 70 AND momentum >= 0; Amber: score 40-69 OR momentum < 0; Red: score < 40 OR no activity 14+ days | Traffic-light status |
| **DAU** | Distinct `user_id` on a given date | Daily pulse |
| **WAU** | Distinct `user_id` in trailing 7 days | Weekly breadth |
| **MAU** | Distinct `user_id` in trailing 30 days | Monthly baseline |

### Risk Engine (`src/lib/risk-calculations.ts`)

5 weighted rules, points summed to produce risk score:

| Rule | Points | Trigger |
|------|--------|---------|
| No events 14 days | +30 | `days_since_last_activity > 14` |
| Active users drop >40% WoW | +25 | `(prev_week_users - current_week_users) / prev_week_users > 0.4` |
| Single module 4 weeks | +20 | `distinct_products <= 1` in trailing 28 days |
| p95 latency >10s | +15 | `metadata_json.response_time` p95 > 10,000ms |
| Trust ratio drop >20% | +10 | `thumbs_up / (thumbs_up + thumbs_down)` dropped >20% vs prior 4 weeks |

Risk levels: 0-20 Low, 21-50 Medium, 51+ High.

Each triggered rule maps to a suggested action (e.g., "Schedule urgent check-in").

### Cohort Analysis (`src/lib/risk-calculations.ts`)

- Groups customers by `go_live_date` month
- Tracks adoption score per week (0-12 weeks post go-live)
- Retention = `active_users_week_N / active_users_week_0 x 100`
- Uses same Reach/Frequency/Depth formula per cohort-week

### Insight Engine (`src/lib/insight-engine.ts`)

Rule-based insight generation, 5 rules ranked by priority:

| Rule | Priority | Trigger |
|------|----------|---------|
| Critical Risk | High | Any customer risk score > 50 |
| User Drop | High | Any customer momentum < -30% |
| Adoption Surge | Growth | Any customer momentum > +15% |
| Breadth Limitation | Optimization | Customers using only 1 module |
| Cohort Plateau | Optimization | Week 4 score <= Week 2 score |

Max 5 insights surfaced, sorted: High > Growth > Optimization.

### Feature Insights (`src/lib/insights-calculations.ts`)

- **Module Leaderboard**: Ranks features by click count, shows unique users, cases, avg latency
- **Sub-Feature Leaderboard**: Drills into sub-features via `metadata_json.sub_feature` or `event_name` parsing
- **Clicks Trend**: Daily clicks vs page views timeline
- **Agent Leaderboard**: Per-agent usage score = `(clicks/max x 40) + (modules/max x 30) + (subFeatures/max x 20) + (cases/max x 10)`
- **Time-on-Case**: Burst-based engaged time calculation with configurable gap threshold (default 10 min). Groups events by user+case, measures time between consecutive events within bursts

### Weighted Scoring (Roadmap) (`src/lib/agent-helper-constants.ts`)

| Dimension | Default Weight | Score Range |
|-----------|---------------|-------------|
| Common Customer Ask | 30% | 0-5 |
| Competitor/Market Research | 30% | 0-5 |
| Seller/Prospect Input | 15% | 0-5 |
| Technical Debt | 15% | 0-5 |
| Executive Input | 10% | 0-5 |

Formula: `sum((score_i / 5) x 100 x (weight_i / 100))` for each dimension. Result: 0-100.

### Metric Registry (`src/lib/metric-definitions.ts`)

18 metrics registered with id, name, category, definition, formula, interpretation, edge cases, and data source. Categories: adoption, engagement, scoring, health. Used for tooltips, the Definitions Dictionary drawer, and Snapshot Mode cards.

---

## Summary of Changes

| # | Task | Files |
|---|------|-------|
| 1 | Make all Agent Helper fields required in `RoadmapItem` | `RoadmapCard.tsx` |
| 2 | Type `computeWeightedScore` to accept `RoadmapItem` | `agent-helper-constants.ts` |
| 3 | Remove `as any` casts from roadmap components | `AgentHelperTableView.tsx`, `AgentHelperTimelineView.tsx`, `WeightedSheetView.tsx`, `RoadmapItemDialog.tsx`, `BulkImportDialog.tsx`, `WeightConfigDialog.tsx` |
| 4 | Remove `supabase.from() as any` casts | Same files + `Roadmap.tsx` |
| 5 | Fix light mode colors in `RoadmapCard.tsx` | `RoadmapCard.tsx` (bonus) |

Total: ~8 files modified, ~40 `as any` casts removed, zero logic changes.

