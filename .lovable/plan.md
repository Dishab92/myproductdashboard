

# Sci-Fi Visual Layer + Dark/Light Mode + Snapshot Mode

A comprehensive enhancement adding 4 major features to the PM Master Dashboard while preserving all existing business logic.

---

## A. Starfield / Particle Background

### Approach
Create a lightweight canvas-based starfield component that renders behind all dashboard content.

### New files
- `src/components/effects/Starfield.tsx` -- Canvas-based star renderer with slow drift animation
- `src/components/effects/EffectsMenu.tsx` -- Small popover in top nav with controls: Effect level (Off/Subtle/Medium), Parallax toggle
- `src/context/EffectsContext.tsx` -- Stores effect preferences (level, parallax, reduceMotion) in localStorage

### Implementation details
- Canvas renders ~80 (subtle) or ~160 (medium) tiny white dots with slow random drift
- `requestAnimationFrame` loop at throttled rate (~20fps)
- Auto-pauses when: `document.hidden` is true, `prefers-reduced-motion` is set, or Snapshot Mode is ON
- `pointer-events: none` on the canvas layer
- Placed inside `DashboardLayout.tsx` behind the existing orb layer (which can coexist or be replaced)
- Login page also gets the starfield behind its existing orb background

### Files modified
- `src/components/layout/DashboardLayout.tsx` -- Add `<Starfield />` behind content, add EffectsMenu to top nav bar
- `src/pages/Login.tsx` -- Add `<Starfield />` behind login card

---

## B. Dark / Light Mode Toggle

### Approach
Use `next-themes` (already installed) to manage dark/light class on `<html>`. Define light mode CSS variables alongside existing dark ones.

### New files
- `src/components/layout/ThemeToggle.tsx` -- Sun/Moon icon button using `next-themes` `useTheme()`

### Implementation details
- Wrap the app in `<ThemeProvider attribute="class" defaultTheme="dark" storageKey="pm-theme">` in `App.tsx`
- Add a `.light` or `:root` light-mode variable set in `src/index.css`:
  - Background: light gray-white
  - Cards: white with subtle shadow
  - Text: dark gray/black
  - Primary accent stays cyan but slightly deeper for contrast
  - Health colors adjusted for light bg readability
  - Chart gridlines and labels adjusted
- All existing `glass`, `glass-strong`, `glow-*` utilities get light-mode overrides (solid white cards, softer shadows instead of glows)
- Smooth `transition: background-color 0.3s, color 0.3s` on body
- Toggle placed in top nav bar next to Effects menu

### Files modified
- `src/index.css` -- Add `.light` class variable overrides
- `src/App.tsx` -- Wrap with `ThemeProvider`
- `src/components/layout/DashboardLayout.tsx` -- Add `<ThemeToggle />` to top nav area

---

## C. Info Icons + Definitions System

### Approach
Create a centralized metric definitions registry and a reusable `MetricInfo` hover card component, plus a searchable Definitions Dictionary drawer.

### New files
- `src/lib/metric-definitions.ts` -- Central registry of all metric definitions with: id, name, definition, formula, interpretation, edgeCases, source
- `src/components/dashboard/MetricInfoCard.tsx` -- Hover card component (uses Radix HoverCard) showing formatted definition panel. In Snapshot Mode, renders as a pinned card instead of hover
- `src/components/dashboard/DefinitionsDictionary.tsx` -- Sheet/drawer with search bar, categories (Adoption, Engagement, Scoring, Health), each entry showing definition + formula + source

### Metric definitions to include
- Adoption Score (formula: Reach 40% + Frequency 30% + Depth 30%)
- Reach (active_users / licensed_users)
- Frequency (sessions per active user, capped at 5)
- Depth (distinct features / 10)
- Momentum (WoW % change in adoption score)
- Health Badge (Green/Amber/Red rules)
- DAU / WAU / MAU
- Active Users, Sessions
- Total Customers, Customers at Risk
- Agent Usage metrics
- Case QA Score, Grade

### Implementation details
- `MetricInfoCard` accepts a `metricId` prop, looks up definition from the registry
- In normal mode: renders as a `HoverCard` triggered by an info icon
- In Snapshot Mode: renders as a visible pinned panel beneath the metric
- `DefinitionsDictionary` is a `Sheet` opened from a "Definitions" button in the top nav
- Search filters definitions by name/description

### Files modified
- `src/components/dashboard/KPICard.tsx` -- Replace inline tooltip with `MetricInfoCard`
- `src/pages/Index.tsx` -- Pass `metricId` to KPI cards
- `src/pages/CustomerSnapshot.tsx` -- Pass `metricId` to KPI cards
- `src/pages/AgentAdoption.tsx` -- Add info icons to section headers
- `src/pages/ReportsHub.tsx` -- Add info icons
- `src/components/layout/DashboardLayout.tsx` -- Add "Definitions" button to top nav

---

## D. Snapshot Mode

### Approach
Create a Snapshot context that toggles the entire dashboard into a clean, export-ready state with pinned definitions and frozen animations.

### New files
- `src/context/SnapshotContext.tsx` -- Provides `isSnapshotMode`, `toggleSnapshot`, `snapshotOptions` (includeDefinitions, includeFilters, includeAlerts)
- `src/components/layout/SnapshotToolbar.tsx` -- Toolbar shown when Snapshot Mode is ON: toggles for Include Definitions/Filters/Alerts, "Export PNG" button, watermark text
- `src/components/layout/SnapshotFrame.tsx` -- Wraps main content with a subtle border frame + watermark (timestamp, selected customer, date range)

### Implementation details
- When Snapshot Mode ON:
  - Starfield animation freezes (checked via SnapshotContext)
  - `MetricInfoCard` components render in pinned mode (visible cards, not hover)
  - Slight increase in padding/whitespace via a CSS class on the main container
  - Upload panels and edit buttons hidden via `hidden` class when `isSnapshotMode`
  - Watermark text rendered at top-right: "PM Dashboard Snapshot", timestamp, active filters
- Export PNG:
  - Use `html2canvas` (new dependency) to capture the main content area
  - Create a download link with the rendered canvas as PNG
  - Before capture: ensure all animations frozen, all pinned definitions visible
- "Snapshot" button in top nav with Camera icon, toggles the mode
- When turned OFF: everything returns to normal, animations resume

### Files modified
- `src/App.tsx` -- Wrap with `SnapshotProvider`
- `src/components/layout/DashboardLayout.tsx` -- Add Snapshot button to top nav, conditionally render `SnapshotToolbar` and `SnapshotFrame`, pass snapshot state to freeze starfield
- `src/pages/Index.tsx` -- Hide upload CTA in snapshot mode, conditionally show pinned definitions
- `src/pages/AgentAdoption.tsx` -- Hide upload panel in snapshot mode
- `src/pages/DataManagement.tsx` -- Hide entire page content in snapshot mode (or redirect)

### New dependency
- `html2canvas` -- for PNG export

---

## E. Top Nav Bar Layout

Add a slim top nav bar inside `DashboardLayout.tsx` (right side of the sidebar layout, above the content area):

```text
[Page Title]                    [ThemeToggle] [EffectsMenu] [Definitions] [Snapshot]
```

- All buttons are icon-only with tooltips
- "Export" button appears only when Snapshot Mode is ON
- Clean, non-cluttered design

---

## F. Accessibility and Performance

- `prefers-reduced-motion` media query: starfield defaults to Off, transitions minimized
- All info icons are keyboard-focusable, Escape closes panels
- Health badge colors tested for WCAG contrast in both themes
- Starfield pauses on `visibilitychange` event
- Canvas uses `devicePixelRatio` capping at 2x for performance

---

## Summary of All Files

| Action | File |
|--------|------|
| Create | `src/components/effects/Starfield.tsx` |
| Create | `src/components/effects/EffectsMenu.tsx` |
| Create | `src/context/EffectsContext.tsx` |
| Create | `src/context/SnapshotContext.tsx` |
| Create | `src/components/layout/ThemeToggle.tsx` |
| Create | `src/components/layout/SnapshotToolbar.tsx` |
| Create | `src/components/layout/SnapshotFrame.tsx` |
| Create | `src/lib/metric-definitions.ts` |
| Create | `src/components/dashboard/MetricInfoCard.tsx` |
| Create | `src/components/dashboard/DefinitionsDictionary.tsx` |
| Modify | `src/index.css` -- Light mode variables |
| Modify | `src/App.tsx` -- ThemeProvider + SnapshotProvider wrappers |
| Modify | `src/components/layout/DashboardLayout.tsx` -- Top nav bar with all controls, Starfield, SnapshotFrame |
| Modify | `src/components/dashboard/KPICard.tsx` -- MetricInfoCard integration |
| Modify | `src/pages/Index.tsx` -- metricIds, snapshot-aware |
| Modify | `src/pages/CustomerSnapshot.tsx` -- metricIds, snapshot-aware |
| Modify | `src/pages/AgentAdoption.tsx` -- info icons, snapshot-aware |
| Modify | `src/pages/ReportsHub.tsx` -- info icons |
| Modify | `src/pages/Login.tsx` -- Starfield background |
| Install | `html2canvas` |

No changes to data logic, calculations, CSV parsers, or metric formulas.

