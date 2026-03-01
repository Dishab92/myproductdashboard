
# Roadmap Control Center

A new module adding a `roadmap_items` table, a top-level "Roadmap" nav item, and three views (Kanban, Timeline, Table) with Customer Safe mode and deck generation.

---

## 1. Database: `roadmap_items` Table

Create via migration:

| Column | Type | Default |
|--------|------|---------|
| id | uuid PK | gen_random_uuid() |
| title | text NOT NULL | |
| description | text | '' |
| product_type | text NOT NULL | 'Agent Helper' |
| category | text NOT NULL | 'Feature' |
| priority | text NOT NULL | 'P1' |
| status | text NOT NULL | 'Backlog' |
| release_quarter | text | |
| target_date | date (nullable) | |
| owner | text | '' |
| customer_visibility | text NOT NULL | 'Internal' |
| linked_customers | text[] | '{}' |
| notes | text | '' |
| owner_id | uuid NOT NULL | |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS: Authenticated users can SELECT, INSERT, UPDATE, DELETE their own rows (`owner_id = auth.uid()`).

Add a trigger to auto-update `updated_at` on row changes.

---

## 2. Navigation

Add to `DashboardLayout.tsx`:
- New nav group **"Roadmap"** with a single item: `{ path: "/roadmap", label: "Roadmap", icon: Map, group: "Roadmap" }`
- Add to `PAGE_TITLES`

Add route in `App.tsx`: `<Route path="/roadmap" element={<Roadmap />} />`

---

## 3. Roadmap Page (`src/pages/Roadmap.tsx`)

Single page with a **tab bar** at top: `Kanban | Timeline | Table`

### Shared Controls (above tabs)
- **Product filter**: All / Agent Helper / Case QA / Escalation Manager
- **Quarter filter**: dropdown of distinct quarters
- **Priority filter**: All / P0 / P1 / P2 / P3
- **Customer Safe toggle**: switch between Internal View and Customer Safe View
- **"+ Add Item" button**: opens a dialog/sheet to create a new roadmap item
- **"Generate Deck" button**: exports filtered items as a downloadable PDF

### Data Fetching
- Query `roadmap_items` from the database filtered by `owner_id`
- Apply client-side filters for product, quarter, priority
- In Customer Safe mode: hide items where `customer_visibility = 'Internal'`, hide notes column, optionally hide P3

---

## 4. Kanban View (`src/components/roadmap/KanbanBoard.tsx`)

Four columns: **Backlog / In Progress / Beta / Released**

Each column shows cards for items matching that status. Cards display:
- Title, product badge (color-coded), priority badge, quarter
- Owner name
- Truncated description

Drag-and-drop to change status (using native HTML drag API to avoid new dependencies). On drop, update the item's `status` in the database.

---

## 5. Timeline View (`src/components/roadmap/TimelineView.tsx`)

Horizontal layout grouped by `release_quarter`. Each quarter is a column/section. Within each quarter, items are grouped by product with color-coded headers. Cards show title, priority badge, and short description. Clean executive layout with generous spacing.

---

## 6. Table View (`src/components/roadmap/TableView.tsx`)

Sortable table with columns: Product | Title | Priority | Status | Quarter | Owner | Actions (edit/delete). Uses the existing `Table` component. Click a column header to sort.

---

## 7. Item CRUD (`src/components/roadmap/RoadmapItemDialog.tsx`)

A dialog/sheet for creating and editing items. Fields map to the table columns:
- Title, Description (textarea), Product Type (select), Category (select), Priority (select), Status (select), Release Quarter (input), Target Date (date picker), Owner (input), Customer Visibility (select: Internal/Customer Safe), Linked Customers (multi-input), Notes (textarea)

On save: insert or update via Supabase client. On delete: confirmation dialog, then delete.

---

## 8. Deck Generation

"Generate Deck" button triggers client-side PDF generation using the existing `html2canvas` dependency:
- Render hidden slides grouped by quarter, then by product
- Each "slide" shows: quarter as title, items with priority badges and descriptions
- Respects Customer Safe toggle (excludes internal items if active)
- Download as PDF using a simple canvas-to-PDF approach (will add `jspdf` as a dependency)

---

## 9. Customer Safe Mode

A toggle switch in the toolbar:
- **Internal View**: shows everything
- **Customer Safe View**: filters out `customer_visibility = 'Internal'` items, hides the notes column, cleaner presentation styling

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| Migration | SQL | Create `roadmap_items` table with RLS + updated_at trigger |
| Modify | `src/App.tsx` | Add `/roadmap` route |
| Modify | `src/components/layout/DashboardLayout.tsx` | Add Roadmap nav item |
| Create | `src/pages/Roadmap.tsx` | Main roadmap page with tabs and filters |
| Create | `src/components/roadmap/KanbanBoard.tsx` | Kanban board view |
| Create | `src/components/roadmap/TimelineView.tsx` | Timeline view |
| Create | `src/components/roadmap/TableView.tsx` | Sortable table view |
| Create | `src/components/roadmap/RoadmapItemDialog.tsx` | Create/edit item dialog |
| Create | `src/components/roadmap/RoadmapCard.tsx` | Shared card component |
| Create | `src/components/roadmap/DeckGenerator.tsx` | PDF deck generation logic |
| Install | `jspdf` | PDF generation dependency |

New dependency: `jspdf` for PDF export. All other UI uses existing shadcn components.
