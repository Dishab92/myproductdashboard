
# Fix Pinned Definition Cards Layout

The pinned definition panels in Snapshot Mode are rendering inside the KPI card's title flex row, causing overlap and text truncation. Two changes fix this:

## 1. Move pinned definition below KPI content (`src/components/dashboard/KPICard.tsx`)

Currently, `MetricInfoCard` sits inline in the title's `flex items-center` row. In Snapshot Mode, the pinned panel expands but gets constrained by the flex layout.

**Fix**: Render `MetricInfoCard` in two places conditionally:
- In normal mode: keep the info icon inline in the title row (current behavior)
- In Snapshot Mode: move the pinned definition panel below the entire KPI content block, as a full-width child of the card

This means the KPI card structure changes to:
```
<card>
  <flex row>  (title + value + icon + trend -- unchanged)
  </flex row>
  {isSnapshotMode && <MetricInfoCard />}  (full-width, below content)
</card>
```

## 2. Ensure pinned panel has proper sizing (`src/components/dashboard/MetricInfoCard.tsx`)

Add `overflow-visible` and `w-full` to the pinned panel container so text wraps cleanly instead of truncating. Also add `break-words` for long formula text.

## Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/KPICard.tsx` | Move MetricInfoCard rendering: icon stays inline in normal mode, pinned panel renders below content in snapshot mode |
| `src/components/dashboard/MetricInfoCard.tsx` | Add `w-full`, `break-words`, and `overflow-visible` to pinned panel; ensure text wraps cleanly |

No new dependencies. No logic changes.
