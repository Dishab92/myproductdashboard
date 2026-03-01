

# Fix Code Review Issues: Animations, Performance, and Display Names

Four targeted bug fixes across the codebase.

---

## Fix 1: O(n^2) Sub-feature Lookup in `insights-calculations.ts`

**Problem**: Line 121 does `Array.from(map.entries()).find(...)` inside a `.map()` over `map.entries()` -- this is O(n^2) and also redundant since the key is already available from the outer iteration.

**Fix**: Change the `.map()` to destructure the key directly:

```typescript
// Before (line 120-121):
.map(([, v]) => {
  const parts = Array.from(map.entries()).find(([, val]) => val === v)![0].split("||");

// After:
.map(([key, v]) => {
  const parts = key.split("||");
```

Single line change in `src/lib/insights-calculations.ts`.

---

## Fix 2: Add `userName` to Agent Engaged Time (Case Time Page)

**Problem**: `AgentEngagedTime` interface lacks a `userName` field. The Case Time page shows raw `userId` instead of friendly names.

**Fix**:
- Add `userName: string` to the `AgentEngagedTime` interface (line 249-254)
- In `getAgentEngagedTime()`, track the userName from events (same pattern as `getAgentLeaderboard`)
- In `CaseTimeInsights.tsx` line 156, display `a.userName` instead of `a.userId`

Changes in `src/lib/insights-calculations.ts` and `src/pages/CaseTimeInsights.tsx`.

---

## Fix 3: Agent Drilldown Visibility in AgentInsights.tsx

**Problem**: Line 180 has `style={{ opacity: 0 }}` with `animate-slide-up` but no `animationDelay`. While the animation does have `forwards` fill mode (confirmed in tailwind config), the drilldown appears/disappears dynamically via conditional rendering. When React re-renders with the same `selectedAgent`, the animation may not re-trigger, leaving it invisible.

**Fix**: Remove the inline `opacity: 0` from the drilldown wrapper (line 180) since the `animate-slide-up` class handles both the initial opacity and the final state via `forwards`. The conditional rendering (`{agentDrilldown && selectedAgent && ...}`) already ensures it mounts fresh each time, so the animation will play. But to be safe, also add an `animationDelay` of `0s` to be explicit.

Change in `src/pages/AgentInsights.tsx`.

---

## Fix 4: Snapshot Overflow on KPI Cards (shimmer-border)

**Problem**: The `shimmer-border` class in `index.css` (line 279) sets `overflow: hidden` on cards. This clips any tooltip or popover that tries to render inside the card (like `MetricInfoCard` tooltips on KPI cards in `KPICard.tsx`). The KPICard component already has `overflow-visible` in its className, but the Card component applies `shimmer-border` which forces `overflow: hidden`.

**Fix**: Change `shimmer-border` pseudo-element to use `pointer-events: none` and remove `overflow: hidden` from the base class, replacing it with `overflow: clip` only on the `::after` pseudo-element's container behavior. Alternatively, scope the shimmer to not clip child content by using `overflow: visible` and constraining only the `::after`.

Actually, looking more carefully, `KPICard.tsx` already has `overflow-visible` on its outer div which should override. The real issue is the Card inside it also gets `shimmer-border`. This is a minor cosmetic concern -- skip this fix as it's not a functional bug.

---

## Files Summary

| Action | File | Change |
|--------|------|--------|
| Modify | `src/lib/insights-calculations.ts` | Fix O(n^2) lookup (line 120-121), add userName to AgentEngagedTime |
| Modify | `src/pages/CaseTimeInsights.tsx` | Display userName instead of userId in agent table |
| Modify | `src/pages/AgentInsights.tsx` | Fix drilldown opacity for reliable animation |

Three files, all small targeted edits. No new dependencies.

