

# Upgrade Dataset Management to Persistent Append Mode

Move event storage from in-memory React state to a database table, enabling incremental uploads that persist across sessions, publishes, and logins.

---

## Overview

Currently all CSV data lives in React state and is lost on page refresh. This upgrade:
- Creates a persistent `events` table and a `datasets` (upload batch) table in the database
- Changes the default upload behavior to **Append** (with deduplication)
- Adds an optional **Replace** mode
- Loads persisted events on app startup
- Keeps the existing CSV parsing and mapping dialog unchanged

---

## 1. Database Tables

### `events` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK, default gen_random_uuid) | Internal row ID |
| event_key | text (unique) | Dedup key: `ts-userId-eventName` |
| event_time | timestamptz | |
| customer_id | text | |
| customer_name | text | |
| product | text | "Agent Helper" or "Case QA" |
| user_id | text | |
| session_id | text | |
| event_name | text | |
| feature | text | Module/feature_category |
| case_id | text (nullable) | |
| channel | text (nullable) | |
| metadata_json | text (nullable) | |
| dataset_id | uuid (FK to datasets) | Batch reference |
| owner_id | uuid (FK to profiles.id) | Who uploaded |
| created_at | timestamptz | |

RLS: Authenticated users can SELECT, INSERT, DELETE their own rows (`owner_id = auth.uid()`).

Index on `event_key` for fast dedup lookups.

### `datasets` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| file_name | text | Original CSV filename |
| detected_format | text | "agent_helper" or "standard" |
| row_count | integer | Total rows in this batch |
| date_min | timestamptz | Earliest event in batch |
| date_max | timestamptz | Latest event in batch |
| mode | text | "append" or "replace" |
| owner_id | uuid | |
| created_at | timestamptz | |

RLS: Authenticated users can SELECT, INSERT, DELETE their own rows.

---

## 2. Upload Flow Changes

### Data Management Page (`DataManagement.tsx`)

Add a toggle/radio before the upload panel:

```
Upload Mode: [Append (default)] [Replace Entire Dataset]
```

**Append mode (default):**
1. Parse CSV (existing logic)
2. Show customer mapping dialog (existing)
3. On confirm: generate `event_key` for each row (`${ts}-${userId}-${eventName}`)
4. Fetch existing `event_key` values from DB for the upload date range
5. Filter out duplicates (rows whose key already exists)
6. Insert new rows into `events` table with a new `dataset_id`
7. Create a `datasets` record for the batch
8. Show summary: "X rows processed, Y new rows inserted, Z duplicates skipped"
9. Reload all events from DB into DataContext

**Replace mode:**
1. Parse and map (same as above)
2. Show confirmation warning: "This will permanently delete all existing events and replace with this upload."
3. On confirm: DELETE all events for this owner, then INSERT new batch
4. Create dataset record with mode="replace"
5. Reload from DB

### Event Key Generation

The dedup key is built from the raw CSV values before any transformation, ensuring deterministic matching:
```
key = `${tsRaw}-${userId}-${eventName}`
```
This matches the existing `seen` Set logic in `csv-parser.ts`.

---

## 3. DataContext Changes (`DataContext.tsx`)

### On Mount: Load from DB
- Add a `loadEvents()` function that queries `SELECT * FROM events WHERE owner_id = auth.uid() ORDER BY event_time`
- Call it on mount (after auth is ready)
- Populate `data.events` and compute `dateRange` from the loaded data
- Show a loading state while fetching

### New methods:
- `appendEvents(newEvents, datasetId)` -- inserts into DB, merges into state
- `replaceEvents(newEvents, datasetId)` -- deletes all, inserts, replaces state
- `refreshEvents()` -- reloads all from DB (called after any upload)

### Remove in-memory-only `setEvents`
Replace with the DB-backed versions above. The signature changes from `setEvents(events)` to the new append/replace methods.

---

## 4. CSV Parser Updates (`csv-parser.ts`)

Add `event_key` generation to the parse result:
- In `parseAgentHelperFormat`: the existing `key` variable (`${tsRaw}-${userId}-${eventName}`) becomes the `event_key` field on EventRecord
- In `parseEventsCSV`: same pattern with `${row.event_time}-${row.user_id}-${row.event_name}`

Add `event_key` to the `EventRecord` type.

---

## 5. Date Range Recomputation

After any append:
- Query `SELECT MIN(event_time), MAX(event_time) FROM events WHERE owner_id = auth.uid()`
- Update `dateRange` in DataContext
- All filters automatically extend to the new range

---

## 6. Data Integrity Summary Updates

Update the summary panel to show:
- Total rows (cumulative)
- Upload history count (number of datasets)
- Latest upload date and batch size
- Option to view upload history (list of datasets with date ranges)

---

## 7. Safety Guarantees

- **No automatic deletion**: Append never removes existing data
- **No duplicates**: `event_key` UNIQUE constraint + client-side filtering
- **Publish-safe**: Data lives in the database, not in-memory
- **Replace requires confirmation**: Explicit user action with warning dialog
- **Batch tracking**: Every upload creates a `datasets` record for audit trail

---

## Files Summary

| Action | File | Change |
|--------|------|--------|
| Create | Migration SQL | Create `events` and `datasets` tables with RLS |
| Modify | `src/lib/types.ts` | Add `event_key` to EventRecord |
| Modify | `src/lib/csv-parser.ts` | Generate `event_key` during parsing |
| Modify | `src/context/DataContext.tsx` | Load from DB on mount, add append/replace methods |
| Modify | `src/pages/DataManagement.tsx` | Add upload mode toggle, DB insert logic, upload history |

No new dependencies. Uses existing Supabase client. Batch inserts use `supabase.from("events").insert()` (chunked for large datasets to stay under payload limits).

