

# Fix: Real Approval Emails via Resend + Chart Visibility

## Overview

When someone signs in with Google, you (disha.bhanot@gmail.com) will receive a real email with an "Approve Access" button. Until you click it, the user sees a "Pending Approval" screen.

Currently the email is only logged to console -- we need to actually send it.

---

## 1. Real Email Delivery via Resend

**What you need to do first:**
1. Go to [resend.com](https://resend.com) and create a free account
2. In the Resend dashboard, copy your API key
3. Paste it when prompted (I will ask you for it during implementation)

**What changes in the code:**

The `notify-admin` edge function (`supabase/functions/notify-admin/index.ts`) will be rewritten to:
- Call the Resend API with a simple `fetch` POST to `https://api.resend.com/emails`
- Send the existing approval HTML email (with the green "Approve Access" button) to `disha.bhanot@gmail.com`
- Use `onboarding@resend.dev` as the sender (works immediately on Resend's free tier, no domain setup needed)
- Remove the AI gateway call and console.log fallback

The rest of the approval flow (approve-user function, pending approval page, database trigger) stays exactly the same.

## 2. Fix Chart Visibility in Light Mode

### TrendLineChart.tsx
- **Line 19**: Change grid stroke from `hsla(220, 20%, 16%, 0.6)` to `hsla(var(--border), 0.4)`
- **Lines 22, 26**: Change axis tick fill from `hsl(215, 15%, 55%)` to `hsl(var(--muted-foreground))`

### ScoreHistogram.tsx
- **Lines 43-44**: Change axis tick fill from `hsl(220, 10%, 46%)` to `hsl(var(--muted-foreground))`
- **Line 45**: Add full theme-aware tooltip styling (background, border, text color using CSS variables)
- **Line 71**: Same tooltip fix for the pie chart

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/notify-admin/index.ts` | Replace console.log with Resend API call |
| `src/components/dashboard/TrendLineChart.tsx` | Theme-aware grid + axis colors |
| `src/components/dashboard/ScoreHistogram.tsx` | Theme-aware tooltip + axis colors |

## Setup Required

A `RESEND_API_KEY` secret will be added to the project. I will prompt you to paste your Resend API key during implementation.

