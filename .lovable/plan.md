
# Plan: Update Customer Names + Add Info Tooltips

## 1. Update Mock Customer Names

Replace placeholder names in `src/lib/mock-data.ts` with real customer names:

**Agent Helper (10 customers -- adding 2 more):**
| Current | New |
|---------|-----|
| Acme Corp | JAMS Software |
| TechFlow Inc | nCino |
| GlobalServ | Accela |
| DataBridge | Nozomi Networks |
| CloudNine | Bluebeam |
| ServiceMax | RainTree |
| HelpDesk Pro | SUSE |
| SupportWise | TechnologyOne |

Add 2 new customers:
- `ah-009`: Command Alkon (Starter tier, ~18 licensed users)
- `ah-010`: (reserve slot or use existing 8 + 2 = 10 total AH customers)

Wait -- the user listed 9 AH customers: JAMS Software, nCino, Accela, Nozomi Networks, Bluebeam, RainTree, SUSE, TechnologyOne, Command Alkon. That's 9, but the spec says 8. I'll map all 9 by adding one more entry.

**Case QA:**
| Current | New |
|---------|-----|
| Acme Corp | Netskope |

## 2. Add Info Icon Tooltips

Add `lucide-react` `Info` icon tooltips to key metrics across pages to explain what each metric means. Using Radix `Tooltip` component already available.

### Locations for info icons:

**Portfolio Overview (`Index.tsx`):**
- KPI Cards: Add tooltip to each KPI title explaining the metric
  - "Total Customers" -- Count of distinct customers in the selected filters
  - "Active Users" -- Distinct users with at least one event in the date range
  - "Avg Adoption Score" -- Weighted score: Reach (40%) + Frequency (30%) + Depth (30%)
  - "Customers at Risk" -- Customers with health status Red (score < 40 or inactive 14+ days)

**Customer Snapshot (`CustomerSnapshot.tsx`):**
- KPI Cards: Same pattern with tooltips for Active Users, Sessions, DAU/WAU/MAU, Adoption Score, Momentum

**Customer Drilldown (`CustomerDrilldown.tsx`):**
- Reach/Frequency/Depth cards: Already have descriptions, add info icon
- Section headers for Adoption Trends, Feature Usage, Session Analysis

**KPICard Component (`KPICard.tsx`):**
- Add optional `tooltip` prop that renders an Info icon with a Radix Tooltip beside the title

### Technical Approach

**Files to modify:**
1. **`src/lib/mock-data.ts`** -- Update `AGENT_HELPER_CUSTOMERS` array (9 entries) and `CASE_QA_CUSTOMERS` (Netskope). Update `CASE_QA_CUSTOMERS` id reference if needed.

2. **`src/components/dashboard/KPICard.tsx`** -- Add optional `tooltip?: string` prop. When present, render an `Info` icon from lucide-react wrapped in a Radix `Tooltip`.

3. **`src/pages/Index.tsx`** -- Pass `tooltip` strings to each KPICard.

4. **`src/pages/CustomerSnapshot.tsx`** -- Pass `tooltip` strings to each KPICard.

5. **`src/pages/CustomerDrilldown.tsx`** -- Add info icons to section headers (Adoption Trends, Feature Usage, Session Analysis) and the Reach/Frequency/Depth cards using inline Tooltip wrappers.

### Tooltip Content

| Metric | Tooltip |
|--------|---------|
| Total Customers | Number of distinct customers with events in the selected date range and filters |
| Active Users | Distinct users who triggered at least one event in the selected period |
| Avg Adoption Score | Weighted average: Reach (40%) + Frequency (30%) + Depth (30%), scale 0-100 |
| Customers at Risk | Customers with Red health: adoption score below 40 or no activity for 14+ days |
| Sessions | Distinct session IDs recorded in the selected period |
| DAU / WAU / MAU | Daily, Weekly (7-day), and Monthly (30-day) active unique users |
| Momentum | Week-over-week percentage change in adoption score |
| Reach | Active users divided by licensed users (40% of adoption score) |
| Frequency | Sessions per active user, normalized (30% of adoption score) |
| Depth | Distinct core actions used, normalized (30% of adoption score) |
