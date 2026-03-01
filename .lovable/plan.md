

# Role-Based Access Control for Roadmap

Implement a role system so only the super admin (Disha) can edit roadmap items, while all other approved users (moderators) get view-only access with snapshot export capability.

---

## 1. Create User Roles Table and Helper Function

Create a new `user_roles` table with an enum (`admin`, `moderator`, `user`) and a `has_role()` security definer function. Seed Disha's account (`disha.bhanot@gmail.com`) as `admin`.

```text
user_roles
+----------+----------+------+
| id (uuid)| user_id  | role |
+----------+----------+------+
|          | disha... | admin|
+----------+----------+------+
```

**Migration includes:**
- `app_role` enum type
- `user_roles` table with RLS enabled
- `has_role()` security definer function
- RLS policies: admins can read all roles, users can read their own
- Seed Disha as admin
- Auto-assign `moderator` role to new users via updated `handle_new_user()` trigger

## 2. Update Roadmap RLS Policies

Modify `roadmap_items` RLS so:
- **SELECT**: All authenticated users can view all roadmap items (not just their own)
- **INSERT / UPDATE / DELETE**: Only users with `admin` role

This means moderators can browse the full roadmap but cannot add, edit, or delete items.

## 3. Update Frontend: Role-Aware Context

Add a `role` field to `AuthContext` by querying `user_roles` after login. Expose an `isAdmin` boolean.

## 4. Update Frontend: Conditionally Hide Edit Controls

In `AgentHelperRoadmap.tsx`:
- Hide "Add Item", "Import", "Weights" buttons for non-admins
- Keep "Generate Deck" (snapshot) visible for everyone

In `AgentHelperTableView.tsx`:
- Hide Edit/Delete action buttons for non-admins

In `WeightedSheetView.tsx`:
- Disable inline score editing for non-admins

In `AgentHelperTimelineView.tsx`:
- Remove click-to-edit cursor for non-admins

## 5. Update Scoring Weights RLS

Allow all authenticated users to **read** scoring weights (needed to display weighted scores), but only admins can insert/update/delete.

---

## Technical Details

### Migration SQL (summary)

```sql
-- Create enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role) ...

-- Seed Disha as admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'disha.bhanot@gmail.com';

-- Update handle_new_user to auto-assign moderator
-- Update roadmap_items RLS: SELECT for all auth, write for admin only
-- Update scoring_weights RLS: SELECT for all auth, write for admin only
```

### AuthContext changes

```typescript
// Add to AuthContext
role: 'admin' | 'moderator' | 'user' | null;
isAdmin: boolean;

// Query user_roles after login
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single();
```

### Component changes

Pass `isAdmin` from context to roadmap components. Conditionally render edit controls:

```typescript
const { isAdmin } = useAuth();
// Hide Add/Import/Weights buttons when !isAdmin
// Keep DeckGenerator visible for all users
```

---

## Files Changed

| File | Change |
|------|--------|
| Migration (new) | Create `user_roles` table, enum, function, seed, update RLS |
| `src/context/AuthContext.tsx` | Add role fetching, expose `isAdmin` |
| `src/pages/AgentHelperRoadmap.tsx` | Hide admin-only toolbar buttons |
| `src/components/roadmap/AgentHelperTableView.tsx` | Hide edit/delete buttons |
| `src/components/roadmap/WeightedSheetView.tsx` | Disable inline editing |
| `src/components/roadmap/AgentHelperTimelineView.tsx` | Remove click-to-edit for non-admins |

