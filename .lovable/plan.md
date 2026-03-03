

# Fix: Approval Email Delivery + Remaining Hover Visibility Issues

## Problem Summary

Three issues to address:

1. **Approval emails are never sent** -- the `notify-admin` edge function generates the HTML but only logs it to console. No email is actually delivered to the admin.
2. **Chart grid lines invisible in light mode** -- `TrendLineChart.tsx` has a hardcoded dark stroke color.
3. **ScoreHistogram tooltips unstyled** -- missing theme-aware background/text colors, and hardcoded axis tick colors.

---

## Changes

### 1. Fix Approval Email Delivery (`supabase/functions/notify-admin/index.ts`)

Replace the current console-log-only approach with actual email sending using Supabase Auth Admin's `sendRawEmail` or, more reliably, by calling the Supabase REST API to invoke the built-in email service.

**Approach:** Use `supabase.auth.admin.inviteUserByEmail` is not appropriate here. Instead, use the **Resend** integration or the Lovable Cloud email sending capability. Since we have `ADMIN_EMAIL` secret configured, we can send the email using Supabase's built-in `pg_net` extension or a direct SMTP/API call.

**Recommended approach:** Use Supabase's `auth.admin` API to send a custom email, or integrate a simple email-sending mechanism. The cleanest path is to use the Supabase `pg_net` HTTP extension to call an email API, but since we're in an edge function, we can directly use the `fetch` API to call a transactional email service.

**Simplest fix:** Since Lovable Cloud has email domain capabilities, configure email sending through the platform's built-in email infrastructure:
- Check if a custom email domain is configured
- Use the Supabase project's built-in SMTP to send the approval notification to the admin

**Implementation:**
- Rewrite the `notify-admin` function to use Supabase's built-in auth email sending (via `supabase.auth.admin`) or use `pg_net` to POST to an email API
- If no email service is available, fall back to auto-approving users from a whitelist of allowed email domains (e.g., `@grazitti.com`), making the flow seamless

**Alternative fast fix (recommended for now):**
- Add a domain whitelist (e.g., `grazitti.com`) in the `handle_new_user` database trigger
- Users from whitelisted domains get auto-approved on signup
- Other users still go through the approval flow
- This makes sign-in seamless for known team members

### 2. Fix TrendLineChart Grid Visibility (`src/components/dashboard/TrendLineChart.tsx`)

**Line 19:** Change hardcoded CartesianGrid stroke:
```
Before: stroke="hsla(220, 20%, 16%, 0.6)"
After:  stroke="hsla(var(--border), 0.4)"
```

### 3. Fix ScoreHistogram Theme Awareness (`src/components/dashboard/ScoreHistogram.tsx`)

**Lines 43-44:** Replace hardcoded axis tick fills:
```
Before: fill: "hsl(220, 10%, 46%)"
After:  fill: "hsl(var(--muted-foreground))"
```

**Lines 45 and 71:** Add full theme-aware tooltip contentStyle to both Tooltip components:
```typescript
contentStyle={{
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  color: "hsl(var(--card-foreground))",
  boxShadow: "0 4px 12px hsla(0, 0%, 0%, 0.15)",
}}
```

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/notify-admin/index.ts` | Add domain-based auto-approval or actual email sending |
| `src/components/dashboard/TrendLineChart.tsx` | Fix CartesianGrid stroke to use theme variable |
| `src/components/dashboard/ScoreHistogram.tsx` | Fix tooltip contentStyle + axis tick colors |

## Clarification Needed

For the approval flow, there are two paths:

**Option A -- Domain Whitelist (fast, seamless):** Auto-approve users from specific email domains (e.g., `grazitti.com`) in the database trigger. Other domains still require manual approval.

**Option B -- Real Email Delivery:** Set up an email domain through Lovable Cloud and send actual approval emails to the admin. This requires configuring an email domain.

Both can coexist. The recommendation is Option A for immediate team access + Option B for external users later.

