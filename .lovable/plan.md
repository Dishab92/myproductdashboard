

# Agent Adoption: Use Events Data Only, Filter by Customer

## What's Changing

1. **Remove the Agent Adoption CSV upload** — no more separate CSV upload panel, customer name input, or `agentAdoption` data source
2. **Derive all data from `data.events`** — map `user_id` as agent, `feature`/`event_name` as feature used, count events as usage, `customer_name` for filtering
3. **Customer dropdown always visible** — populated from distinct `customer_name` values in events (Accela, SUSE, Jama, Revenera, etc.), defaulting to "All"
4. **Empty state updated** — instead of "Upload CSV", show "No event data. Upload reports CSV in Data Management."

## File: `src/pages/AgentAdoption.tsx`

- Remove imports: `parseAgentAdoptionCSV`, `UploadPanel`, `Input`
- Remove state: `customerInput`, `uploadResult`
- Remove `setAgentAdoption` from `useData()`
- Remove the upload Card block entirely
- Change `allRecords` to always derive from `data.events`:
  ```ts
  const allRecords = useMemo(() => {
    return data.events.map(e => ({
      date: e.event_time,
      agentName: e.user_id,
      featureUsed: e.feature || e.event_name,
      usageCount: 1,
      customerName: e.customer_name,
    }));
  }, [data.events]);
  ```
- Customer dropdown always shows (when customers > 1), built from `data.events` customer names
- All existing charts (leaderboard, feature breakdown, daily trend, heatmap) remain unchanged — they already work off `filtered` which derives from `allRecords`
- Update empty state message to reference Data Management page

No changes needed to `DataContext.tsx` or any other file — the `agentAdoption` array in state simply won't be used by this page anymore.

