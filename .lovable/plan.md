

# Smooth Page Transition Animations

Add a fade + subtle slide-up transition when navigating between sidebar pages, using a wrapper component keyed on the current route.

## Approach

Create a `PageTransition` wrapper component that uses `useLocation()` to detect route changes and applies a CSS fade-in + slide-up animation each time the route key changes. This is lightweight (no extra dependencies) and uses the existing `slide-up` keyframe already defined in the project.

## Changes

### 1. Create `src/components/layout/PageTransition.tsx`

A small wrapper component that:
- Takes `children` and a `locationKey` prop
- Applies the `animate-slide-up` class (already defined: translateY(20px) + opacity 0 to normal, 0.5s)
- Uses the React `key` prop set to `locationKey` so React re-mounts the wrapper on each route change, retriggering the animation
- Respects `prefers-reduced-motion` by skipping animation (already handled in existing CSS)

### 2. Modify `src/components/layout/DashboardLayout.tsx`

- Import `PageTransition`
- Wrap `{children}` (inside the SnapshotFrame) with `<PageTransition locationKey={location.pathname}>`
- This ensures every page navigation triggers a smooth fade-in slide-up

No new dependencies. No changes to routing logic or data flow.

