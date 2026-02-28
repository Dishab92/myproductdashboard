

# Add Info Tooltips to Reports Hub

Add informational tooltips to the Reports Hub page to match the pattern already established on other pages.

## Changes

**File: `src/pages/ReportsHub.tsx`**

Add tooltips to:

1. **Ranking Table section** -- Explain that the table ranks customers by adoption score (Reach 40% + Frequency 30% + Depth 30%) for the selected filters.

2. **Comparison Chart section** -- Explain that the chart shows daily active user trends for the top 5 customers by adoption score.

3. **Export CSV button area** -- Add a small info icon tooltip explaining what columns are included in the export.

### Implementation

- Import `Info`, `Tooltip`, `TooltipProvider`, `TooltipTrigger`, `TooltipContent` (same pattern as CustomerDrilldown)
- Add inline tooltip icons next to the "Ranking Table" and "Comparison Chart" tab content headers
- Add tooltip next to the "Top 5 Customers" chart title

### Tooltip Content

| Location | Tooltip Text |
|----------|-------------|
| Ranking Table header | Customers ranked by adoption score. Score = Reach (40%) + Frequency (30%) + Depth (30%) |
| Comparison Chart title | Daily active user trends for the top 5 customers by adoption score |
| Export CSV | Exports customer, product, tier, active users, sessions, adoption score, momentum, and health status |

### Technical Details

- Uses existing `TooltipProvider` / `Tooltip` / `TooltipTrigger` / `TooltipContent` from `@/components/ui/tooltip`
- Uses `Info` icon from `lucide-react` (already a dependency)
- Follows the same inline pattern used in `CustomerDrilldown.tsx` section headers

