

# Fix: Approve-User Edge Function Shows Raw HTML + Redirect to Login

## Problem
The `approve-user` edge function renders raw HTML source in the browser instead of a styled page. Additionally, you want it to redirect to the login page after successful approval.

## Root Cause
The edge function returns HTML with `Content-Type: text/html`, but the Supabase edge function runtime may strip or override response headers when not using CORS headers. The function is also missing CORS headers entirely (unlike `notify-admin`).

## Solution
Replace the HTML response with a **redirect** to the app's login page after approval. For error/info states, redirect with query parameters that the Login page can display as toast messages.

### Changes

**1. `supabase/functions/approve-user/index.ts`**
- After successful approval: HTTP 302 redirect to `https://myproductdashboard.lovable.app/login?approved=true`
- For "already approved": redirect to `/login?approved=already`
- For errors: redirect to `/login?approved=error`
- Add CORS headers for completeness

**2. `src/pages/Login.tsx`**
- On mount, check URL query params for `approved`
- Show a toast: "Access approved! Sign in now." / "Already approved." / "Approval failed."
- Strip the query param from URL after showing

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/approve-user/index.ts` | Replace HTML responses with 302 redirects to login page |
| `src/pages/Login.tsx` | Read `?approved=` query param and show appropriate toast |

