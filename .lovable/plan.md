
# Fix Hover Visibility Issues

## Problem

Chart tooltips and info hover cards are not visible in light mode due to hardcoded dark-theme colors.

## Changes

### 1. Fix Chart Tooltip Styles (FeatureBarChart.tsx + TrendLineChart.tsx)

Both charts hardcode dark tooltip styles:
```
backgroundColor: "hsla(220, 30%, 8%, 0.9)"  // nearly black
color: "hsl(210, 20%, 95%)"                 // nearly white
border: "1px solid hsla(195, 100%, 50%, 0.2)"
```

Replace inline `contentStyle` with CSS custom property-aware values that work in both modes:
- Light mode: white/light background, dark text, subtle border
- Dark mode: dark glass background, light text, cyan glow border

Use a shared tooltip style object or switch to using `wrapperClassName` with Tailwind classes. Since Recharts `contentStyle` doesn't support Tailwind's `dark:` prefix, we'll use CSS variables from the theme (`--card`, `--card-foreground`, `--border`).

Updated tooltip contentStyle for both files:
```typescript
contentStyle={{
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--card-foreground))",
  boxShadow: "0 4px 12px hsla(0, 0%, 0%, 0.15)",
}}
```

### 2. Fix Recharts Bar Cursor (FeatureBarChart.tsx)

The default Recharts cursor renders a gray rectangle over the hovered bar, making it look washed out. Add `cursor={{ fill: "hsla(var(--primary), 0.08)" }}` to the Tooltip to make the hover highlight subtle and theme-aware.

### 3. Fix Info Icon Visibility (MetricInfoCard.tsx)

The Info icon uses `text-muted-foreground/60` which is very faint in light mode. Change to `text-muted-foreground` (full opacity) so it's clearly visible.

## Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/FeatureBarChart.tsx` | Theme-aware tooltip contentStyle, subtle cursor fill |
| `src/components/dashboard/TrendLineChart.tsx` | Theme-aware tooltip contentStyle |
| `src/components/dashboard/MetricInfoCard.tsx` | Increase Info icon opacity |
