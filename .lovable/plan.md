

# Fix: Hover Tooltips Not Visible / Getting Cropped

## Root Cause
Two issues causing hover content to be invisible or clipped:

1. **HoverCard (MetricInfoCard)** does not use a Portal — its content renders inside the DOM tree where parent containers have `overflow-hidden` or `overflow-auto`, causing it to get clipped.
2. **Recharts chart tooltips** — the tooltip content text may not be visible due to z-index or overflow clipping from card containers.

## Changes

### 1. `src/components/ui/hover-card.tsx`
Add `HoverCardPrimitive.Portal` wrapper around `HoverCardContent`, same pattern as `popover.tsx`. This portals the content to `document.body`, escaping all overflow constraints.

### 2. `src/components/dashboard/MetricInfoCard.tsx`
Increase z-index on `HoverCardContent` to ensure it renders above all layout layers (sidebar z, header z-20, etc.). Add `z-[100]` class.

### 3. `src/pages/CustomerDrilldown.tsx`
Ensure the Radix `<Tooltip>` components wrapping Info icons have proper `TooltipProvider` with Portal rendering (they already use Radix Tooltip which portals by default — verify z-index is sufficient).

| File | Change |
|------|--------|
| `src/components/ui/hover-card.tsx` | Wrap content in `HoverCardPrimitive.Portal` |
| `src/components/dashboard/MetricInfoCard.tsx` | Add `z-[100]` to HoverCardContent |

