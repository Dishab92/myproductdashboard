

# Fix Light Mode Readability, Text Cropping, and Simplify Snapshot Toolbar

---

## Problem 1: Light Mode Badge Readability

All badge color constants in `agent-helper-constants.ts` use dark-mode-only colors like `text-emerald-300`, `text-blue-300`, etc. These `-300` shades are nearly invisible on light backgrounds. The same issue affects `PRIORITY_COLORS` in `WeightedSheetView.tsx` and `AgentHelperTableView.tsx`.

### Fix

Update all color maps in `src/lib/agent-helper-constants.ts` to use Tailwind's `dark:` prefix pattern so badges are readable in both modes:

- Dark mode keeps `-300` text shades (e.g., `text-emerald-300`)
- Light mode uses `-700` or `-600` text shades (e.g., `text-emerald-700`)

Example change:
```text
Before: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
After:  "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
```

Apply this pattern across all three maps: `STATUS_COLORS`, `FEATURE_TYPE_COLORS`, `FEATURE_SOURCE_COLORS`.

Also fix `PRIORITY_COLORS` in both `WeightedSheetView.tsx` and `AgentHelperTableView.tsx` with the same dark/light text treatment.

---

## Problem 2: Text Cropping in Tables

Badge text at `text-[10px]` inside tight table cells can get clipped. Add `whitespace-nowrap` to badges and ensure minimum cell padding accommodates the content.

### Fix
- Add `whitespace-nowrap` to Badge usage in table rows across `WeightedSheetView.tsx` and `AgentHelperTableView.tsx`
- Ensure the feature title column in `WeightedSheetView.tsx` doesn't crop by allowing wrapping there (it already has `min-w-[200px]`)

---

## Problem 3: Snapshot Toolbar Too Complex

The snapshot toolbar currently shows three toggles (Definitions, Filters, Alerts) which are too many controls. The user wants snapshot to only highlight **Customer** and **Product** context, plus the Export button.

### Fix

1. **Simplify `SnapshotOptions`** in `SnapshotContext.tsx`:
   - Remove `includeDefinitions`, `includeFilters`, `includeAlerts`
   - No toggle options needed -- snapshot mode just adds watermark + export

2. **Simplify `SnapshotToolbar.tsx`**:
   - Remove all three Switch toggles
   - Keep only the "Snapshot Mode" label, a brief product/customer context line, and the Export PNG button

3. **Clean up references** in `Index.tsx` and other pages that check `options.includeFilters`, `options.includeAlerts`, `options.includeDefinitions` -- remove those conditionals so content always shows normally in snapshot mode

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/agent-helper-constants.ts` | Add `dark:` prefix for light-mode-safe badge text colors across all 3 color maps |
| `src/components/roadmap/WeightedSheetView.tsx` | Fix `PRIORITY_COLORS` for light mode, add `whitespace-nowrap` to badges |
| `src/components/roadmap/AgentHelperTableView.tsx` | Fix `PRIORITY_COLORS` for light mode, add `whitespace-nowrap` to badges |
| `src/context/SnapshotContext.tsx` | Remove `includeDefinitions`, `includeFilters`, `includeAlerts` options |
| `src/components/layout/SnapshotToolbar.tsx` | Remove toggle switches, keep only label + Export PNG |
| `src/pages/Index.tsx` | Remove conditional checks on `options.includeFilters` and `options.includeAlerts` |

