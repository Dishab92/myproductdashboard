

# Build Feature Insights, Agent Insights, and Time-on-Case Analytics

Three new pages answering core PM questions: which features are used most, which agents use AH the most, and how much time agents spend on cases.

---

## Overview

| Page | Route | Purpose |
|------|-------|---------|
| Feature Insights | `/insights/features` | Module and sub-feature usage leaderboards, charts |
| Agent Insights | `/insights/agents` | Agent usage scoring, leaderboard, drilldown |
| Case Time Insights | `/insights/cases` | Estimated engaged time per case, agent, and module |

---

## 1. Calculation Engine (`src/lib/insights-calculations.ts`) -- NEW

All three pages share a calculation layer. This file contains pure functions operating on `EventRecord[]`:

### Feature Calculations
- `getModuleLeaderboard(events, interactionFilter?)` -- returns array of `{ module, totalInteractions, clicks, uniqueUsers, uniqueCases, avgLatency }` sorted by clicks
- `getSubFeatureLeaderboard(events, interactionFilter?)` -- returns `{ subFeature, module, totalInteractions, clicks, uniqueUsers, uniqueCases, avgLatency }` with sub_feature extracted from `metadata_json`
- `getClicksTrend(events)` -- daily click counts for trend chart

### Agent Calculations
- `getAgentLeaderboard(events)` -- computes **Agent Usage Score** per `user_id`:
  - 40% normalized total clicks (interaction_type containing "user_action")
  - 30% normalized distinct modules (feature field)
  - 20% normalized distinct sub-features (from metadata_json)
  - 10% normalized unique cases touched
  - Normalization: each metric divided by the max across all agents, then multiplied by weight, scaled to 0-100
  - Returns: `{ userId, userName, usageScore, clicks, modulesUsed, subFeaturesUsed, casesTouched, mostUsedModule, avgLatency? }`

### Time-on-Case Calculations
- `computeEngagedTime(events, gapThresholdMinutes = 10)` -- the core burst algorithm:
  - Group events by `user_id + case_id` (skip events without case_id)
  - Sort by `event_time`
  - Walk through: if gap between consecutive events <= threshold, extend current burst; else start new burst
  - Burst duration = last event time - first event time in burst
  - Returns per-case summaries: `{ caseId, customerId, totalEngagedMs, burstCount, uniqueAgents, totalInteractions, topModule }`
- `getAgentEngagedTime(events, gapThreshold)` -- aggregate engaged time per agent
- `getModuleEngagedTime(events, gapThreshold)` -- aggregate engaged time per module
- Helper: `formatDuration(ms)` -- converts milliseconds to "Xh Ym" or "Xm Ys" human-readable string

### Interaction Type Helpers
- `isClick(event)` -- checks if event_name starts with "user_action:"
- `isPageView(event)` -- checks for "page_view:"
- `isSystemLatency(event)` -- checks for "system_latency:"
- Extract `response_time_ms` from `metadata_json` when available for latency calculations

---

## 2. Feature Insights Page (`src/pages/FeatureInsights.tsx`) -- NEW

### Layout
- Header: "Feature Insights" with subtitle
- Filter bar: Customer selector (All / specific), Date range (from FilterBar), Interaction type filter (All / Clicks only / Page views only)
- Empty state if no data

### Sections (using Tabs: Modules / Sub-features / Trends)

**Modules Tab:**
- KPI cards row: Total Modules, Total Clicks, Total Unique Users, Avg Latency
- Top Modules leaderboard table: Module | Total Interactions | Clicks | Unique Users | Unique Cases | Avg Latency
- Horizontal bar chart: top 10 modules by clicks (reuse BarChart pattern from existing FeatureBarChart)

**Sub-features Tab:**
- Top Sub-features leaderboard table: Sub-feature | Module | Total Interactions | Clicks | Unique Users | Unique Cases | Avg Latency
- Horizontal bar chart: top 10 sub-features by clicks

**Trends Tab:**
- Line chart: daily clicks over time (using recharts LineChart, same pattern as AgentAdoption daily trend)

---

## 3. Agent Insights Page (`src/pages/AgentInsights.tsx`) -- NEW

### Layout
- Header: "Agent Insights"
- Filter bar: Customer selector, Date range
- Empty state if no data

### Sections

**KPI Cards:**
- Total Agents, Avg Usage Score, Total Clicks, Total Cases Touched

**Agent Leaderboard:**
- Table with columns: Rank | Agent (user_name or user_id) | Usage Score (0-100, with colored bar) | Clicks | Modules Used | Sub-features Used | Cases Touched | Most Used Module
- Sorted by Usage Score descending
- Click on agent row expands an inline drilldown or scrolls to detail section

**Agent Drilldown (expandable or below):**
- When an agent is selected:
  - Module breakdown bar chart for that agent
  - Top cases touched (table: Case ID | Interactions | Engaged Time)
  - Engaged time total for that agent (from time-on-case calculation)

**Usage Score methodology note:**
- Small info tooltip explaining the 40/30/20/10 weighting

---

## 4. Case Time Insights Page (`src/pages/CaseTimeInsights.tsx`) -- NEW

### Layout
- Header: "Estimated Time on Case"
- Subtitle/label: "Estimated engaged time (based on interaction bursts with 10-min gap threshold)"
- Filter bar: Customer selector, Date range
- If no case_id data in events: show disabled message "Case IDs not available in uploaded data. Time-on-case analysis requires case_number field."

### Sections

**KPI Cards:**
- Avg Engaged Time per Case
- Median Engaged Time per Case
- Total Engaged Time (all cases in filter)
- Cases with High Engaged Time (> 30 min)

**Case Leaderboard:**
- Table: Case ID | Customer | Engaged Time | Burst Count | Unique Agents | Total Interactions | Top Module
- Sorted by engaged time descending

**Agent Engaged Time:**
- Table: Agent | Total Engaged Time | Avg per Case | Cases Touched
- Sorted by total engaged time descending

**Module Engaged Time:**
- Table: Module | Total Engaged Time | Avg per Case
- Sorted by total engaged time descending

---

## 5. Navigation and Routing

### Update `src/components/layout/DashboardLayout.tsx`
Add 3 new nav items with a visual group separator "Insights":
```
{ path: "/insights/features", label: "Feature Insights", icon: BarChart3 }
{ path: "/insights/agents", label: "Agent Insights", icon: UserCheck }
{ path: "/insights/cases", label: "Case Time", icon: Clock }
```

### Update `src/App.tsx`
Add routes:
```
<Route path="/insights/features" element={<FeatureInsights />} />
<Route path="/insights/agents" element={<AgentInsights />} />
<Route path="/insights/cases" element={<CaseTimeInsights />} />
```

---

## 6. Files Summary

| Action | File |
|--------|------|
| Create | `src/lib/insights-calculations.ts` -- All calculation functions for features, agents, and engaged time |
| Create | `src/pages/FeatureInsights.tsx` -- Feature usage leaderboards with tabs and charts |
| Create | `src/pages/AgentInsights.tsx` -- Agent leaderboard with usage score and drilldown |
| Create | `src/pages/CaseTimeInsights.tsx` -- Estimated engaged time analytics |
| Modify | `src/components/layout/DashboardLayout.tsx` -- Add 3 nav items in an "Insights" group |
| Modify | `src/App.tsx` -- Add 3 new routes |

No new dependencies. All charts use existing recharts. All data comes from the uploaded CSV via DataContext. Gap threshold defaults to 10 minutes.

