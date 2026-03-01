

# Agent Helper Roadmap with Weighted Scoring

Extend the existing Roadmap module to add a dedicated Agent Helper sub-page with sheet-like weighted scoring, fixed dropdown values matching your Google Sheets, and three specialized views.

---

## 1. Database Changes

### Alter `roadmap_items` table

Add new columns to the existing table (no new table needed):

| Column | Type | Default |
|--------|------|---------|
| target_bucket | text | 'Future' |
| sprint | text | '' |
| jira_link | text | '' |
| feature_type | text | 'New Feature' |
| feature_source | text | 'Product' |
| score_common_customer_ask | integer | 0 |
| score_competitor_market_research | integer | 0 |
| score_seller_prospect_input | integer | 0 |
| score_technical_debt | integer | 0 |
| score_executive_input | integer | 0 |

The `comments` field already exists as `notes`. The `status` column already exists and will accept the new expanded values. The `priority` column already exists.

### Create `scoring_weights` table

Stores per-user weight configuration:

| Column | Type | Default |
|--------|------|---------|
| id | uuid PK | gen_random_uuid() |
| owner_id | uuid NOT NULL | |
| product_type | text | 'Agent Helper' |
| w_common_customer_ask | integer | 30 |
| w_competitor_market_research | integer | 30 |
| w_seller_prospect_input | integer | 15 |
| w_technical_debt | integer | 15 |
| w_executive_input | integer | 10 |

RLS: Users manage their own rows. Unique constraint on (owner_id, product_type).

---

## 2. Weighted Score Computation

Computed client-side (no DB column needed):

```
weightedScore = 
  (score1/5)*100*(w1/100) + (score2/5)*100*(w2/100) + ... 
```

Result is 0-100. Color coding:
- 80-100: green badge
- 50-79: amber badge
- below 50: red badge

Tooltip shows per-dimension contribution breakdown.

---

## 3. Navigation Update

Add a sub-item under the existing "Roadmap" group in the sidebar:
- `/roadmap` -- existing general Roadmap (Kanban/Timeline/Table for all products)
- `/roadmap/agent-helper` -- new Agent Helper specific page

Update `DashboardLayout.tsx` NAV_ITEMS and PAGE_TITLES. Add route in `App.tsx`.

---

## 4. Agent Helper Roadmap Page

New file: `src/pages/AgentHelperRoadmap.tsx`

### Toolbar (top)
- Target Bucket filter dropdown
- Status filter dropdown (with all 9 exact values)
- Feature Type filter dropdown
- Feature Source filter dropdown
- Priority filter dropdown
- Customer Safe toggle
- "Bulk Import" button
- "+ Add Item" button
- "Generate Deck" button

### View Switcher (tabs)
- Weighted Sheet View (default)
- Table View
- Timeline View

---

## 5. New Components

### `src/components/roadmap/WeightedSheetView.tsx`
Sheet-like grid with:
- Left frozen columns: Title, Status, Feature Type, Feature Source, Priority, Target Bucket, Jira Link
- Right scrollable columns: 5 score dimensions (each 0-5 dropdown for inline edit), Weighted Score column
- Default sort: weighted score descending
- Inline score editing: clicking a score cell shows a small 0-5 dropdown, saves immediately on change
- Row click opens edit dialog

### `src/components/roadmap/AgentHelperTableView.tsx`
Table with columns: Status (pill), Feature Type (colored chip), Feature Source (colored chip), Priority (badge), Title, Target Bucket, Sprint, Jira Link, Comments, Weighted Score
- Inline editing for text fields
- Status/Type/Source rendered as colored pills/chips

### `src/components/roadmap/AgentHelperTimelineView.tsx`
Timeline grouped by `target_bucket` (Nov Release, Dec Release, Jan Q1 2026, Feb 2026, March 2026, April 2026, Future).
Cards show: Title, Priority badge, Status pill, Feature Source chip, Weighted Score badge.
Click opens detail drawer.

### `src/components/roadmap/WeightScoreBadge.tsx`
Colored badge (green/amber/red) with tooltip showing score breakdown per dimension.

### `src/components/roadmap/BulkImportDialog.tsx`
Dialog with:
- CSV paste area or file upload
- Maps columns: title, status, feature_type, feature_source, priority, target_bucket, jira_link, comments, and 5 score fields
- Missing scores default to 0
- Shows preview table before import
- Inserts into `roadmap_items` with product_type = "Agent Helper"

### `src/components/roadmap/WeightConfigDialog.tsx`
Settings dialog for editing the 5 weights. Enforces total = 100 (blocks save otherwise). Loads/saves from `scoring_weights` table.

### Update `src/components/roadmap/RoadmapItemDialog.tsx`
Add the new fields: target_bucket dropdown, feature_type dropdown, feature_source dropdown, sprint, jira_link, and 5 score sliders (0-5). Show these fields when product_type is "Agent Helper".

### Update `src/components/roadmap/RoadmapCard.tsx`
Add `RoadmapItem` interface fields for the new columns (target_bucket, sprint, jira_link, feature_type, feature_source, score fields).

---

## 6. Fixed Dropdown Values

These exact strings will be used as constants:

**STATUS**: Complete, In Development, In QA, To Do, Grooming to be planned, In Story writing, On Hold, To be planned for dev, In Review

**FEATURE TYPE**: New Feature, UX Improvement, Analytics and Reporting, Enhancement/Optimization, Relevance, Technical Debt

**FEATURE SOURCE**: Product, Customer Request, CSM, Sales, Executive, Technical Debt

**PRIORITY**: P0, P1, P2, P3

**TARGET BUCKET**: Nov Release, Dec Release, Jan Q1 2026, Feb 2026, March 2026, April 2026, Future

---

## 7. Customer Safe Mode

When toggled ON:
- Filter to only `customer_visibility = "Customer Safe"` items
- Hide comments/notes column
- Hide Feature Source = "Technical Debt" items (optional, controlled by a sub-toggle)
- Clean presentation layout suitable for screenshots

---

## 8. Files Summary

| Action | File |
|--------|------|
| Migration | SQL: ALTER roadmap_items + CREATE scoring_weights |
| Create | `src/pages/AgentHelperRoadmap.tsx` |
| Create | `src/components/roadmap/WeightedSheetView.tsx` |
| Create | `src/components/roadmap/AgentHelperTableView.tsx` |
| Create | `src/components/roadmap/AgentHelperTimelineView.tsx` |
| Create | `src/components/roadmap/WeightScoreBadge.tsx` |
| Create | `src/components/roadmap/BulkImportDialog.tsx` |
| Create | `src/components/roadmap/WeightConfigDialog.tsx` |
| Modify | `src/components/roadmap/RoadmapCard.tsx` (extend interface) |
| Modify | `src/components/roadmap/RoadmapItemDialog.tsx` (add AH fields) |
| Modify | `src/components/layout/DashboardLayout.tsx` (add nav item) |
| Modify | `src/App.tsx` (add route) |

