

# Fix: Real Email Delivery for Approval + Chart Visibility

## 1. Send Real Approval Emails via Resend

The `notify-admin` edge function currently only logs the email HTML to console. We need to actually deliver it to your inbox (disha.bhanot@gmail.com).

**Approach:** Use Resend (a transactional email service) to send the approval notification. This requires:

1. You create a free Resend account at [resend.com](https://resend.com)
2. Get your API key from the Resend dashboard
3. We store it as a secret in your project
4. The edge function sends the approval email to your admin address

**What changes in `supabase/functions/notify-admin/index.ts`:**
- Import the Resend library
- Replace the `console.log` calls with an actual `resend.emails.send()` call
- Send the existing approval HTML (with the "Approve Access" button) to the admin email
- On Resend's free tier, you can send from `onboarding@resend.dev` immediately (no domain setup needed), or verify your own domain for a branded sender address

**No changes to the approval flow itself** -- the approve-user function, the pending approval page, and the database trigger all stay exactly as they are. The only change is that the email actually gets delivered now.

## 2. Fix Chart Visibility (Light Mode)

### TrendLineChart.tsx (line 19)
Change hardcoded CartesianGrid stroke from `hsla(220, 20%, 16%, 0.6)` (invisible in light mode) to a theme-aware value. Also fix axis tick fills on lines 22 and 26.

### ScoreHistogram.tsx (lines 43-45, 71)
- Replace hardcoded axis tick fills with `hsl(var(--muted-foreground))`
- Add full theme-aware tooltip `contentStyle` (background, border, text color) to both Tooltip components

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/notify-admin/index.ts` | Replace console.log with Resend email send |
| `src/components/dashboard/TrendLineChart.tsx` | Fix grid stroke + axis tick colors for light mode |
| `src/components/dashboard/ScoreHistogram.tsx` | Fix tooltip styles + axis tick colors |

## Setup Step Required

Before implementation, you will need to provide a Resend API key. I will walk you through getting one after you approve this plan.

