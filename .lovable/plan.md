

# Update Mock Data to Match Real SUSE Feature Structure

Update the Agent Helper mock data to use the real feature categories and event names visible in the SUSE spreadsheet, so the dashboard reflects actual product usage patterns.

## What Changes

### 1. Update Feature Categories (`src/lib/mock-data.ts`)

Replace the generic `AH_FEATURES` with the real feature categories from the spreadsheet:
- Case Summary
- Case Timeline
- Response Assist
- Top Articles
- Top Related Cases
- Top Experts

### 2. Update Event Names (`src/lib/mock-data.ts`)

Replace the generic `AH_EVENTS` with the real sub-feature actions from the spreadsheet:
- Clicked on brief case summary
- Clicked on detailed case summary
- Response generated on first load of response-assist
- Clicked on Top Articles tab
- Clicked on Top Related Cases tab
- Clicked on Top Experts tab
- Clicked on Response Assist tab
- No. of times Regenerate Response clicked
- Tonality model opened
- Clicked on preview icon
- No. of times Copy to Clipboard clicked
- Tone for response assist saved
- Time taken to generate response
- Time taken to generate summary

### 3. Weighted Feature Distribution (`src/lib/mock-data.ts`)

Add realistic weighting so feature usage proportions match the spreadsheet chart:
- Case Summary: ~35% of events (highest)
- Case Timeline: ~28%
- Response Assist: ~20%
- Top Articles: ~9%
- Top Related Cases: ~5%
- Top Experts: ~3%

This uses a weighted random selection instead of uniform random.

### 4. Map Events to Feature Categories (`src/lib/mock-data.ts`)

Create a mapping so each event name is tied to its correct feature category (e.g., "Clicked on brief case summary" maps to "Case Summary"), ensuring the Feature Usage chart groups correctly.

## Files Modified

- `src/lib/mock-data.ts` -- Update AH_FEATURES, AH_EVENTS, and event generation logic with weighted distribution and event-to-feature mapping

## Result

When viewing SUSE (or any Agent Helper customer) in the Customer Drilldown, the feature usage chart and table will show the real feature categories (Case Summary, Case Timeline, etc.) with realistic proportions matching the spreadsheet data.

