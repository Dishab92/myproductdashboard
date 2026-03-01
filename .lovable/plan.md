

# Fix CSV Upload: Auto-Detect Agent Helper Layout

The current parser requires exact columns (`event_time`, `customer_id`, `customer_name`, `product`, `session_id`, `event_name`, `feature`), which rejects your real Agent Helper CSV. This plan adds auto-detection and field mapping so your CSV works out of the box, plus a tenant configuration table for customer names and go-live dates.

---

## 1. Add Auto-Detection to CSV Parser (`src/lib/csv-parser.ts`)

Add a new function `detectAndParseEventsCSV(text)` that:

1. Parses headers and checks if `feature_category`, `feature_name`, `interaction_type`, and `tenant_id` are all present
2. If yes: classify as "Agent Helper" format and run the new mapping logic
3. If no: fall through to existing `parseEventsCSV` (standard format)

### Agent Helper Mapping Logic

For each row, map fields as follows:

| CSV Column | Maps To | Notes |
|-----------|---------|-------|
| `ts` | `event_time` | Parse as full datetime; if invalid, skip row with warning |
| `tenant_id` | `customer_id` | Direct mapping |
| `user_id` | `user_id` | Direct mapping |
| `feature_category` | `feature` (module) | Used as the primary feature field |
| `feature_name` | stored in `metadata_json` as sub_feature context | Also used to derive `event_name` |
| `interaction_type` | normalized and used in `event_name` | See normalization below |
| `case_number` | `case_id` | Optional |
| `uid` | stored in `metadata_json` as `client_uid` | NOT used for sessions |
| `metric` | `metadata_json` | Parse JSON for response_time, api_status |

Derived fields:
- `event_name` = `interaction_type + ":" + feature_category + ":" + feature_name`
- `product` = constant `"Agent Helper"`
- `session_id` = generated as `user_id + "-" + date_portion` (synthetic daily session, since CSV has no session concept)
- `customer_name` = looked up from tenant config (see section 4), fallback to `tenant_id`

### Interaction Type Normalization
- `click` -> `user_action`
- `page view` / `pageview` -> `page_view`
- `response_time` -> `system_latency`
- Everything else: keep as-is

### Metric JSON Parsing
If `metric` column value looks like JSON with `response_time` or `api_status`:
- Extract `response_time` as integer, `api_status` as integer
- Store both in `metadata_json` as `{"response_time_ms": N, "api_status": N, "client_uid": "..."}`
- If JSON parse fails: log warning but continue

### Return Value
Same shape as `parseEventsCSV`: `{ events, errors, total, detectedFormat: "agent_helper" | "standard" }`. Add `detectedFormat` to signal the UI about which format was auto-detected.

---

## 2. Update Data Management Page (`src/pages/DataManagement.tsx`)

- Replace `parseEventsCSV` call with `detectAndParseEventsCSV`
- Update the events upload panel description to say: "Supports both standard format and Agent Helper format (auto-detected)"
- Show detected format in the success message (e.g., "Agent Helper format detected. 12,345 events loaded...")
- If `ts` parsing produces warnings, show them but still load parseable rows

### Add Tenant Configuration Section

Add a new section below the upload panels: "Customer Configuration"

- A simple editable table with columns: `tenant_id`, `customer_name`, `go_live_date`, `stage`
- Pre-populate tenant_id values from uploaded events (distinct `customer_id` values)
- Allow manual entry of `customer_name`, `go_live_date`, and `stage`
- Store configuration in DataContext (new `tenantConfig` state)
- When config is saved, update `customer_name` on all existing events and auto-generate `CustomerRecord` entries
- Persist config to localStorage so re-uploads skip the mapping step

---

## 3. Update Types (`src/lib/types.ts`)

Add:
```text
TenantConfig {
  tenant_id: string
  customer_name: string
  go_live_date: Date | null
  stage: string  // e.g., "Live", "Pilot", "Onboarding"
}
```

Update `AppData` to include:
```text
tenantConfig: TenantConfig[]
```

---

## 4. Update DataContext (`src/context/DataContext.tsx`)

- Add `tenantConfig` state with localStorage persistence (load on mount, save on change)
- Add `setTenantConfig` setter exposed via context
- When `tenantConfig` changes, update `customer_name` on all events and regenerate `customers` array from config
- Add `tenantConfig` and `setTenantConfig` to context type

---

## 5. Create Tenant Config Component (`src/components/dashboard/TenantConfigTable.tsx`)

- Renders an editable table of tenant configurations
- Columns: Tenant ID (read-only), Customer Name (editable input), Go-Live Date (date input), Stage (select: Live/Pilot/Onboarding)
- "Save" button applies config and updates events + customer records
- Shows count of events per tenant for context
- Futuristic card styling consistent with the rest of the dashboard

---

## 6. Update Upload Panel Description (`src/components/dashboard/UploadPanel.tsx`)

- Add optional `detectedFormat` prop to show a badge indicating which format was detected
- No structural changes needed

---

## Files Summary

| Action | File |
|--------|------|
| Modify | `src/lib/csv-parser.ts` -- Add `detectAndParseEventsCSV` with auto-detection and Agent Helper mapping |
| Modify | `src/lib/types.ts` -- Add `TenantConfig` interface, update `AppData` |
| Modify | `src/context/DataContext.tsx` -- Add `tenantConfig` state with localStorage persistence |
| Create | `src/components/dashboard/TenantConfigTable.tsx` -- Editable tenant configuration table |
| Modify | `src/pages/DataManagement.tsx` -- Use new parser, add tenant config section, show detected format |
| Modify | `src/components/dashboard/UploadPanel.tsx` -- Add optional format badge |

No new dependencies. No database changes needed (tenant config stored in localStorage for Phase 1).

