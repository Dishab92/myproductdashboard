# Futuristic UI Overhaul -- Dark Command Center

Transform every page from the current plain light-green SaaS look into a dark, glowing, animated command center with glassmorphism, neon accents, floating orbs, and micro-interactions.

## 1. Color System and Global Styles (`src/index.css`)

Replace the light `:root` variables with a dark-first palette:

- Background: deep navy-black (`222 47% 5%`)
- Cards: dark translucent panels (`220 30% 8%` at 80% opacity)
- Primary: electric cyan (`195 100% 50%`)
- Accent colors: neon violet (`270 100% 65%`), hot magenta (`330 100% 60%`)
- Health badges keep green/amber/red but gain neon glow

Add new CSS utility classes:

- `.glass` -- `backdrop-blur-xl`, translucent bg, subtle border glow
- `.glow-cyan` / `.glow-violet` -- colored box-shadow glow
- `.animate-float` -- gentle 6s up-down float
- `.animate-slide-up` -- staggered entrance from below with fade
- `.animate-glow-pulse` -- subtle pulsing box-shadow
- `.animate-shimmer` -- gradient sweep across borders
- Animated background orbs (CSS-only radial gradients with drift animation)

## 2. Animations (`tailwind.config.ts`)

Add keyframes and animation utilities:

- `float`: translateY oscillation over 6s
- `glow-pulse`: box-shadow intensity pulse over 2s
- `slide-up`: translateY(20px) + opacity 0 to normal, 0.5s
- `shimmer`: background-position sweep for border gradients
- `orb-drift-1`, `orb-drift-2`, `orb-drift-3`: slow translate paths for background orbs (20-30s loops)

## 3. Login Page (`src/pages/Login.tsx`)

- Full-screen dark background with 3 animated gradient orbs (cyan, violet, magenta) drifting slowly
- Glassmorphic card with `backdrop-blur-2xl`, semi-transparent dark bg, glowing cyan border
- Shield icon wrapped in an animated glow ring (pulsing cyan ring)
- Title: "PM Master Dashboard" with a gradient text effect (cyan to violet)
- Subtitle: "Command your product universe" (sassier copy)
- Google button with gradient background (cyan to blue), hover glow effect
- Small decorative grid dots pattern in the background for depth
- Staggered fade-in animation for card elements

## 4. Pending Approval Page (`src/pages/PendingApproval.tsx`)

- Match login aesthetic: dark bg with floating orbs
- Glassmorphic card, amber glow ring around clock icon
- Animated scanning line effect across the card (horizontal shimmer)

## 5. Dashboard Layout (`src/components/layout/DashboardLayout.tsx`)

- Sidebar: deep gradient bg (near-black to dark navy), frosted glass effect
- Active nav item: glowing left border (2px cyan), subtle bg glow, smooth transition
- Logo "My Product Dashboard" with gradient text (cyan-to-violet)
- Animated thin accent line under logo that pulses
- Main content area: 3 background orbs (smaller, more subtle) behind content
- Bottom badge "Internal Tool" gets a subtle border-top glow

## 6. KPI Cards (`src/components/dashboard/KPICard.tsx`)

- Dark glassmorphic background with `backdrop-blur`
- Top border with subtle gradient (cyan to violet)
- On hover: scale up slightly + border glow intensifies + slight shadow lift
- Icon area: small circular glow backdrop
- Value text: slightly larger, with a subtle text-shadow glow
- `animate-slide-up` entrance with staggered delays when page loads

## 7. Health Badge (`src/components/dashboard/HealthBadge.tsx`)

- Neon pill style: dark bg with colored border + text-shadow glow matching color
- Subtle `glow-pulse` animation on red badges (attention grab)

## 8. Trend Badge (`src/components/dashboard/TrendBadge.tsx`)

- Dark bg with neon text, subtle glow matching positive/negative color

## 9. Customer Table (`src/components/dashboard/CustomerTable.tsx`)

- Translucent header with `backdrop-blur`
- Row hover: cyan glow highlight (left border + subtle row bg glow)
- Alternating row opacity for depth

## 10. Charts Updates (all chart components)

- Update chart color constants to neon palette: cyan, violet, magenta, electric blue, amber
- Tooltip: dark glassmorphic style (dark bg, blur, glowing border)
- Grid lines: very subtle (low opacity)

## 11. Portfolio Overview (`src/pages/Index.tsx`)

- Wrap KPI cards in a container with staggered `animate-slide-up` (delay per card)
- Section headers get a small decorative accent line (gradient)
- Alert card: dark bg with amber left-border glow

## 12. Customer Snapshot (`src/pages/CustomerSnapshot.tsx`)

- Same staggered entrance animations
- Card sections get glass treatment

## 13. Agent Adoption (`src/pages/AgentAdoption.tsx`)

- Same glass + animation treatment
- Heatmap cells: use cyan-to-violet gradient intensity instead of single color
- Upload section: bordered with dashed cyan border, glow on drag

## 14. Card Component (`src/components/ui/card.tsx`)

- Update default Card styles to use dark glassmorphic treatment globally

## Files Modified


| File                                           | Scope                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| `src/index.css`                                | Complete color overhaul, orb animations, glass/glow utility classes |
| `tailwind.config.ts`                           | New keyframes (float, glow-pulse, slide-up, shimmer, orb-drift)     |
| `src/pages/Login.tsx`                          | Animated orb bg, glass card, gradient text, glow ring, sassy copy   |
| `src/pages/PendingApproval.tsx`                | Match login aesthetic                                               |
| `src/components/layout/DashboardLayout.tsx`    | Dark sidebar, glow nav, orb bg, gradient logo                       |
| `src/components/dashboard/KPICard.tsx`         | Glass bg, gradient border, hover glow, slide-up                     |
| `src/components/dashboard/HealthBadge.tsx`     | Neon glow pills                                                     |
| `src/components/dashboard/TrendBadge.tsx`      | Dark bg, neon text                                                  |
| `src/components/dashboard/CustomerTable.tsx`   | Glass header, glow hover rows                                       |
| `src/components/dashboard/FeatureBarChart.tsx` | Neon chart colors, glass tooltip                                    |
| `src/components/dashboard/TrendLineChart.tsx`  | Neon chart colors, glass tooltip                                    |
| `src/components/ui/card.tsx`                   | Global dark glass default                                           |
| `src/pages/Index.tsx`                          | Staggered animations, accent lines                                  |
| `src/pages/CustomerSnapshot.tsx`               | Glass + animations                                                  |
| `src/pages/AgentAdoption.tsx`                  | Glass + animations, gradient heatmap                                |
| `src/App.css`                                  | Clean up unused styles                                              |


No new dependencies required -- all effects are pure CSS/Tailwind.