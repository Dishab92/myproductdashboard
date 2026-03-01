
# Strict Data Mode: Remove Mock Data, Enforce CSV-Only Analytics

Eliminate all demo/mock/seed data. The dashboard shows an empty state until a real CSV is uploaded. Add strict validation, full dataset replacement on upload, a data integrity summary panel, and date-range-aware filters.

---

## 1. Remove Mock Data System

### Delete `src/lib/mock-data.ts`
- Remove the entire file (generateMockEvents, generateMockCustomers, generateMockScores)

### Update `src/context/DataContext.tsx`
- Remove the import of `generateMockEvents`, `generateMockCustomers`, `generateMockScores`
- Remove the `useEffect` block (lines 83-89) that loads mock data on mount
- Initial state stays as-is (empty arrays, `lastUpload: null`) -- this is already correct
- `hasData` already returns false when events are empty, so the empty state on Index.tsx will show automatically

### Update `setEvents` in DataContext
- Change to full replacement: clear previous customers/scores/agentAdoption when new events are uploaded
- Add console logging on import: earliest timestamp, latest timestamp, row count
- Auto-set dateRange to match the actual data range (min/max of event_time)

```text
setEvents: (events) => {
  // FULL REPLACEMENT - clear all previous data
  const sorted = [...events].sort((a, b) => a.event_time.getTime() - b.event_time.getTime());
  const from = sorted[0]?.event_time || new Date();
  const to = sorted[sorted.length - 1]?.event_time || new Date();
  
  console.log("[DataImport] Rows:", events.length);
  console.log("[DataImport] Earliest:", from.toISOString());
  console.log("[DataImport] Latest:", to.toISOString());
  console.log("[DataImport] Invalid ts rows: logged at parse time");
  
  setDateRange({ from, to, label: "All Data" });
  setData(prev => ({
    ...prev,
    events: applyTenantConfig(events, prev.tenantConfig),
    customers: generateCustomersFromConfig(prev.tenantConfig),
    scores: [],
    agentAdoption: [],
    lastUpload: new Date(),
  }));
}
```

---

## 2. Strict CSV Validation (`src/lib/csv-parser.ts`)

### Add hard-error validation in `parseAgentHelperFormat`

Before processing rows, check that each row has non-empty values for required fields:
- `tenant_id`, `user_id`, `feature_category`, `feature_name`, `interaction_type`, `ts`

If a row is missing any required field, skip it and count as a hard error. If the majority (>50%) of rows fail validation, stop the import entirely and return an error.

### Add majority-failure check for datetime parsing
- Track `invalidDates` count (already done)
- After the loop: if `invalidDates > rows.length * 0.5`, return error: "Invalid datetime format in ts column. Import stopped. Over 50% of rows had unparseable timestamps."

### Add warnings for optional fields
- If `metric` is present but not valid JSON, count and report as warning
- If `case_number` is missing on rows, note in warnings

### Remove any fallback date logic
- The parser already skips rows with invalid dates (line 97) -- this is correct
- Confirm no `new Date()` fallback is used for event_time anywhere

---

## 3. Full Dataset Replacement on Upload (`src/pages/DataManagement.tsx`)

### Update `handleEventsUpload`
- On successful upload, show confirmation: "Dataset replaced successfully."
- The `setEvents` call already triggers full replacement (from step 1)

### Update `handleCustomersUpload` and `handleScoresUpload`
- These already do full replacement via `setCustomers`/`setScores` -- no change needed

### Add Data Integrity Summary Panel

Add a prominent card at the top of the Data Management page (and optionally on Portfolio Overview) that shows:

```text
DATA INTEGRITY SUMMARY
-----------------------------------------------
Rows Imported:        12,345
Unique Customers:     8
Unique Users:         142
Date Range:           2025-01-15 -> 2025-02-28
Modules Detected:     6
Cases Detected:       234
Format:               Agent Helper
-----------------------------------------------
```

This panel:
- Only shows when data is loaded (`hasData`)
- Computes all values directly from `data.events` (no cached/derived values)
- Shows modules as distinct `feature` values
- Shows cases as distinct `case_id` values (excluding undefined)

---

## 4. Date Filters Respect True Data Range (`src/components/dashboard/FilterBar.tsx`)

### Replace hardcoded date presets with data-aware presets

- Compute `dataMin` and `dataMax` from `data.events` (min/max `event_time`)
- Replace the static "7 Days / 30 Days / 90 Days / 6 Months" buttons with:
  - "All Data" -- full range from dataMin to dataMax
  - "Last 7 Days" -- max(dataMin, dataMax - 7 days) to dataMax
  - "Last 30 Days" -- max(dataMin, dataMax - 30 days) to dataMax
  - "Last 90 Days" -- max(dataMin, dataMax - 90 days) to dataMax
- All presets are clamped to the actual data range
- If the selected range returns no data, show: "No data available for selected range."

### Remove hardcoded release filter options
- Dynamically generate release options from `data.customers` releases
- Keep "All Releases" as the default

---

## 5. Clean Up Remaining Pages

### All chart components
- Charts already receive data via props from computed metrics
- Since mock data is removed, charts will be empty until CSV is uploaded
- The empty state on Index.tsx already handles this (lines 81-97)

### Verify no other files import from mock-data.ts
- Search for any remaining references and remove them

---

## Files Summary

| Action | File |
|--------|------|
| Delete | `src/lib/mock-data.ts` |
| Modify | `src/context/DataContext.tsx` -- Remove mock data loading, enforce full replacement, auto-set date range, add console logging |
| Modify | `src/lib/csv-parser.ts` -- Add strict validation (hard errors for missing required fields, majority-failure stop, warnings for optional fields) |
| Modify | `src/pages/DataManagement.tsx` -- Add Data Integrity Summary panel, update success messages |
| Modify | `src/components/dashboard/FilterBar.tsx` -- Data-aware date presets, dynamic release options, clamp to actual range |

No new dependencies. No database changes.
