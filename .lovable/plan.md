

# Google Authentication with Email-Based Approval

When a new user signs in with Google, an approval request email is sent to **Disha.bhanot@gmail.com**. Clicking the "Approve" link in the email instantly grants the user access. Until approved, the user sees a "Pending Approval" screen.

## How It Works

```text
User signs in with Google
        |
        v
Profile created (approved = false)
        |
        v
Backend function sends email to Disha
with an "Approve" link
        |
        v
User sees "Pending Approval" screen
        |
        v
Disha clicks "Approve" link in email
        |
        v
Backend function sets approved = true
        |
        v
User refreshes and gets full access
```

## Implementation Steps

### 1. Configure Google OAuth

Use the social auth configuration tool to enable Google sign-in (managed by Lovable Cloud -- no API keys needed).

### 2. Create Database: `profiles` Table + Trigger

**profiles table:**
- `id` (uuid, primary key, references auth.users on delete cascade)
- `email` (text)
- `full_name` (text)
- `avatar_url` (text)
- `approved` (boolean, default false)
- `approval_token` (uuid, default gen_random_uuid()) -- unique token used in approval link
- `created_at` (timestamptz)

**RLS policies:**
- Users can read their own profile
- No direct update to `approved` from client (only via backend function)

**Database trigger:** On new auth user signup, auto-insert a profile row pulling email/name from auth metadata.

### 3. Create Backend Function: `notify-admin` (Edge Function)

Triggered after a new profile is created (called from the database trigger via `pg_net` or from the client after signup).

- Receives the new user's email and approval_token
- Sends an email to **Disha.bhanot@gmail.com** using Lovable AI (or a simple HTTP-based email approach)
- Email contains:
  - Who signed up (name + email)
  - An **"Approve"** button/link pointing to the `approve-user` edge function with the approval_token

### 4. Create Backend Function: `approve-user` (Edge Function)

- Receives `token` as a query parameter from the approval link
- Looks up the profile by `approval_token`
- Sets `approved = true`
- Returns an HTML page saying "User approved successfully"

### 5. Create Auth Context (`src/context/AuthContext.tsx`)

- Listens to `onAuthStateChange` for session changes
- Fetches the user's profile (including `approved` status)
- Exposes `user`, `profile`, `isApproved`, `signOut`, `loading`
- Polls or re-checks approval status so user doesn't need to log out/in

### 6. Create Login Page (`src/pages/Login.tsx`)

- Clean, branded page matching the dashboard's futuristic design
- "Sign in with Google" button using `lovable.auth.signInWithOAuth("google", ...)`

### 7. Create Pending Approval Page (`src/pages/PendingApproval.tsx`)

- Shown to authenticated but unapproved users
- Message: "Your account is pending approval. You'll receive access once the admin approves your request."
- "Check Again" button to re-fetch profile status
- Sign-out button

### 8. Create Route Protection (`src/components/ProtectedRoute.tsx`)

- Not authenticated --> redirect to `/login`
- Authenticated but not approved --> redirect to `/pending`
- Approved --> render dashboard

### 9. Update `src/App.tsx`

- Wrap routes in `AuthProvider`
- `/login` and `/pending` as public routes
- All dashboard routes wrapped with `ProtectedRoute`

## Files to Create

| File | Purpose |
|------|---------|
| `src/context/AuthContext.tsx` | Auth state, profile fetching, approval check |
| `src/pages/Login.tsx` | Google sign-in page |
| `src/pages/PendingApproval.tsx` | Waiting screen for unapproved users |
| `src/components/ProtectedRoute.tsx` | Route guard component |
| `supabase/functions/notify-admin/index.ts` | Sends approval email to Disha |
| `supabase/functions/approve-user/index.ts` | Handles approval link click |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add AuthProvider, ProtectedRoute, login/pending routes |

## Database Changes (Migration)

- Create `profiles` table with `approval_token` column
- Create trigger to auto-insert profile on signup
- Create RLS policies
- Use `pg_net` extension to call the `notify-admin` function on new profile insert

## Email Format

The approval email to Disha will look like:

**Subject:** New Dashboard Access Request

**Body:**
> A new user has requested access to the PM Master Dashboard.
>
> **Name:** [User's Google name]
> **Email:** [User's Google email]
> **Requested at:** [Timestamp]
>
> [Approve Access] (button linking to approve-user function)

## Technical Notes

- The approval link is a one-time-use URL containing a unique token -- no login required to approve
- The `approve-user` function uses the service role key to update the profile, bypassing RLS
- The admin email (Disha.bhanot@gmail.com) is stored as a secret in the backend, not hardcoded in frontend code
- Email sending will use Lovable AI's built-in capabilities or a lightweight HTTP approach via the edge function

