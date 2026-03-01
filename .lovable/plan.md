

# Customer Name Mapping During CSV Upload

Add an intermediate step between CSV parsing and data loading: a mandatory customer name mapping dialog that pauses the import until all tenant IDs have friendly names assigned.

---

## 1. Create Customer Mapping Dialog (`src/components/dashboard/CustomerMappingDialog.tsx`)

A modal dialog (using Radix Dialog) that appears after CSV parsing but before data is committed.

**Props:**
- `tenantIds: string[]` -- distinct tenant IDs found in parsed events
- `existingConfig: TenantConfig[]` -- saved config from localStorage (auto-fill known names)
- `fileName: string` -- original CSV filename (for name suggestion)
- `eventCount: number` -- total rows parsed
- `dateRange: { min: Date; max: Date }` -- for confirmation display
- `onConfirm: (mapping: Record<string, string>) => void` -- called with tenant_id-to-name map
- `onCancel: () => void`
- `open: boolean`

**Behavior:**

- Pre-populate customer names from `existingConfig` (previously saved mappings)
- For unmapped tenant IDs, attempt to extract a suggested name from the filename:
  - Strip file extension, split on common delimiters (spaces, underscores, hyphens), take the first word/phrase that is not a date keyword ("since", "nov", "jan", numbers)
  - Example: `"Accela since nov.csv"` suggests `"Accela"`
  - Only suggest for single-tenant uploads
- Show either:
  - **Single tenant**: Simple card with tenant ID shown and a single input for customer name, pre-filled with suggestion
  - **Multiple tenants**: Editable table with Tenant ID (read-only) and Customer Name (input) columns

**Validation (on Confirm click):**
- All customer names must be non-empty (after trim)
- All customer names must be unique (case-insensitive)
- Show inline validation errors per row

**Confirmation summary** shown at the bottom of the dialog:
```
Ready to import:
Customer: Accela
Rows: 8,716
Date Range: Nov 2024 - Jan 2025
```

Date range formatted as `MMM YYYY - MMM YYYY` using date-fns `format()`.

---

## 2. Update Data Management Page (`src/pages/DataManagement.tsx`)

Change the upload flow to a two-phase process:

**Phase 1: Parse CSV** (existing `handleEventsUpload`)
- Parse CSV using `detectAndParseEventsCSV`
- If errors and no events, show error as before
- If events parsed successfully, extract distinct `tenant_id` values, compute date range
- Store parsed events and metadata in local state (`pendingImport`)
- Open the `CustomerMappingDialog`
- Do NOT call `setEvents` yet

**Phase 2: Confirm mapping** (dialog `onConfirm` callback)
- Receive `Record<string, string>` mapping from dialog
- Update `tenantConfig` via `setTenantConfig` (persists to localStorage)
- Apply mapping to parsed events (replace `customer_name` field)
- Call `setEvents` with the mapped events
- Show the confirmation result with customer name, row count, and date range
- Close dialog

**New state variables:**
```text
pendingImport: {
  events: EventRecord[];
  tenantIds: string[];
  dateMin: Date;
  dateMax: Date;
  fileName: string;
  detectedFormat: string;
  errors: string[];
} | null
```

**Cancel behavior:** Clear `pendingImport`, show message "Import cancelled."

---

## 3. Update Upload Panel (`src/components/dashboard/UploadPanel.tsx`)

Add an optional `onUploadWithFile` callback that also passes the File object (for filename access):
- Change `onUpload: (text: string) => void` to `onUpload: (text: string, fileName?: string) => void`
- Pass `file.name` as second argument in `handleFile`

---

## 4. Persist Mapping in Tenant Config

The existing `TenantConfigTable` and `DataContext` already handle localStorage persistence of tenant config. The mapping dialog will call `setTenantConfig` to save mappings. On subsequent uploads:
- Known tenant IDs auto-fill from saved config
- User can still edit names before confirming
- The `TenantConfigTable` on the page remains for post-upload editing

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/components/dashboard/CustomerMappingDialog.tsx` |
| Modify | `src/pages/DataManagement.tsx` -- Two-phase upload flow with pending state and dialog |
| Modify | `src/components/dashboard/UploadPanel.tsx` -- Pass filename in callback |

No new dependencies. Uses existing Dialog component and date-fns.

