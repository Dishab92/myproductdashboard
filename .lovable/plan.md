

# Fix: Prevent Repeated Approval Email Sends

## Problem

The `fetchProfile` function in `AuthContext.tsx` fires the `notify-admin` edge function **every time the profile is loaded** for an unapproved user -- on every page load, auth state change, and tab refocus. This floods Resend with requests, hitting their 2-requests-per-second rate limit (429 errors visible in logs).

## Solution

Add a `notified` boolean column to the `profiles` table (default `false`). After successfully sending the approval email, set `notified = true`. Only call `notify-admin` when `!data.approved && !data.notified`.

### Database Migration

```sql
ALTER TABLE public.profiles ADD COLUMN notified boolean NOT NULL DEFAULT false;
```

### AuthContext.tsx Change (line 56)

Change the condition from:
```typescript
if (!data.approved)
```
to:
```typescript
if (!data.approved && !data.notified)
```

### notify-admin Edge Function Change

After successfully sending the Resend email, update the profile's `notified` flag to `true` using the service role key so the email is never sent again for that user.

### Profile Interface Update

Add `notified: boolean` to the `Profile` interface in AuthContext.

## Files Changed

| File | Change |
|------|--------|
| Database migration | Add `notified` column to `profiles` |
| `src/context/AuthContext.tsx` | Guard notify call with `!data.notified`, update interface |
| `supabase/functions/notify-admin/index.ts` | Set `notified = true` after successful send |

