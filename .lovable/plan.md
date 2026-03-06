

# Fix Tooltip Cropping + Dataset List with Delete + Agent Adoption from Reports CSV

## Three Issues to Address

### 1. Feature Usage Tooltip Getting Cropped
The `FeatureBarChart` and other bar charts have tooltips that get clipped by the parent card's `overflow-hidden`. Fix by adding `wrapperStyle={{ zIndex: 50 }}` to `<Tooltip>` components and ensuring parent containers don't clip tooltip portals. The Recharts `<Tooltip>` needs `allowEscapeViewBox={{ x: true, y: true }}` to prevent cropping.

**Files**: `src/components/dashboard/FeatureBarChart.tsx`, `src/pages/AgentAdoption.tsx` (its inline charts)

### 2. Dataset List with Delete Capability
Add a "Uploaded Datasets" section to `DataManagement.tsx` that queries the `datasets` table and displays: file name, format, row count, date range, upload time. Each row gets a delete button that removes the dataset and its associated events from the DB, then refreshes.

**Files**: `src/pages/DataManagement.tsx`, `src/context/DataContext.tsx` (add `deleteDataset` method)

### 3. Agent Adoption Should Work from Reports CSV (events.csv)
Currently Agent Adoption only works with a separate agent-level CSV upload. It should also derive agent-level data from the main events dataset — using `user_id` as the agent, `feature` as the feature used, and counting events as usage. This way, when events.csv is uploaded, Agent Adoption automatically shows reports.

**Files**: `src/pages/AgentAdoption.tsx` — add a `useMemo` that derives `agentAdoption`-like records from `data.events` when `data.agentAdoption` is empty. Merge both sources when both exist.

---

## Detailed Changes

### `src/components/dashboard/FeatureBarChart.tsx`
- Add `allowEscapeViewBox={{ x: true, y: true }}` to `<Tooltip>`
- Add `wrapperStyle={{ zIndex: 1000 }}` to ensure tooltip renders above card boundaries

### `src/pages/AgentAdoption.tsx` (inline charts)
- Same tooltip fix for the Feature Breakdown and Usage Trend charts
- Add derived data from `data.events`: group by `user_id` (agent) and `feature`, compute usage counts and dates
- Show both event-derived data and manually uploaded agent adoption data
- When no agent adoption CSV is uploaded but events exist, still show analytics

### `src/pages/DataManagement.tsx`
- Add a new card section "Uploaded Datasets" after the Data Integrity Summary
- Fetch datasets from `supabase.from("datasets").select("*").eq("owner_id", user.id)` on mount
- Display as a table: File Name, Format, Rows, Date Range, Uploaded At, Delete button
- Delete action: remove dataset row + associated events (`dataset_id`), then call `refreshEvents()`
- Add confirmation dialog before delete

### `src/context/DataContext.tsx`
- No changes needed — `refreshEvents` already exists and will reload after deletion

| File | Change |
|------|--------|
| `src/components/dashboard/FeatureBarChart.tsx` | Fix tooltip z-index and escape viewbox |
| `src/pages/AgentAdoption.tsx` | Fix tooltips + derive data from events.csv |
| `src/pages/DataManagement.tsx` | Add dataset list table with delete |

