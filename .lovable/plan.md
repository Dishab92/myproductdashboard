

# Fix Light Mode Colors in Generic TableView

## Problem

`src/components/roadmap/TableView.tsx` has two color maps (`PRIORITY_COLORS` and `STATUS_COLORS`) using dark-mode-only text colors like `text-red-300`, `text-orange-300`, etc. These are nearly invisible on light backgrounds.

## Fix

Update both color maps to use the dual-mode pattern already applied elsewhere:

**PRIORITY_COLORS** (lines 10-15):
- `P0`: `text-red-300` becomes `text-red-700 dark:text-red-300`
- `P1`: `text-orange-300` becomes `text-orange-700 dark:text-orange-300`
- `P2`: `text-yellow-300` becomes `text-yellow-700 dark:text-yellow-300`
- `P3`: no change needed (uses `text-muted-foreground`)

**STATUS_COLORS** (lines 17-22):
- `In Progress`: `text-blue-300` becomes `text-blue-700 dark:text-blue-300`
- `Beta`: `text-purple-300` becomes `text-purple-700 dark:text-purple-300`
- `Released`: `text-green-300` becomes `text-green-700 dark:text-green-300`
- `Backlog`: no change needed (uses `text-muted-foreground`)

## Files Changed

| File | Change |
|------|--------|
| `src/components/roadmap/TableView.tsx` | Update 6 color values to add `dark:` prefix pattern |

Single file, minimal change -- consistent with the pattern already applied to `agent-helper-constants.ts`.

