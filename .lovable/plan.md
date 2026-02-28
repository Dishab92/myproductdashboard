

# Replace Tier with Release Version

Remove the "Tier" concept (Enterprise/Professional/Starter) and replace it with "Release" version based on the spreadsheet data.

## Release Mapping (from the provided spreadsheet)

| Customer | Release |
|----------|---------|
| JAMS Software | Q3:2025 |
| nCino | Q2:2025 |
| Accela | Q1:2025 |
| Nozomi Networks | Q3:2025 |
| Bluebeam | Q4:2024 |
| RainTree | Yet to Go-Live |
| SUSE | Q4:2024 |
| TechnologyOne | Q2:2024 |
| Command Alkon | Yet to Go-Live |
| Netskope (Case QA) | Q3:2024 |

## Files to Modify

### 1. `src/lib/types.ts`
- Rename `tier` to `release` in `CustomerRecord` and `CustomerMetrics` interfaces.

### 2. `src/lib/mock-data.ts`
- Replace `tier` field with `release` in customer arrays using the values above.
- Remove tier-based daily activity logic (line 65: `cust.tier === "Enterprise" ? 0.85 ...`). Replace with a simpler approach using licensed user count as a proxy for activity level.
- Update `generateMockCustomers()` to map `release` instead of `tier`.

### 3. `src/context/DataContext.tsx`
- Rename `tierFilter` / `setTierFilter` to `releaseFilter` / `setReleaseFilter` in the context type and provider.

### 4. `src/components/dashboard/FilterBar.tsx`
- Replace the Tier dropdown with a Release dropdown listing: Q2:2024, Q3:2024, Q4:2024, Q1:2025, Q2:2025, Q3:2025, Yet to Go-Live.

### 5. `src/components/dashboard/CustomerTable.tsx`
- Change "Tier" column header to "Release" and display `c.release` instead of `c.tier`.

### 6. `src/pages/Index.tsx`
- Update `tierFilter` references to `releaseFilter`, filter by `c.release` instead of `c.tier`.

### 7. `src/pages/ReportsHub.tsx`
- Update CSV export header and row data: replace "Tier" with "Release", `m.tier` with `m.release`.

### 8. `src/pages/DataManagement.tsx`
- Update the customers.csv column description text from "tier" to "release".

### 9. `src/lib/calculations.ts`
- Change `tier: cust?.tier || "Unknown"` to `release: cust?.release || "Unknown"` in `getCustomerMetrics()`.

### 10. `src/lib/csv-parser.ts`
- Update `parseCustomersCSV` to map `release` instead of `tier`.

