

# Agent-Wise Adoption Report for Accela

Add support for importing and visualizing agent-level adoption data from CSVs in the format: `Date, Agent Name, Feature Used, Usage Count`.

## What Changes

### 1. New data type and parser
- Add an `AgentAdoptionRecord` type with fields: `date`, `agentName`, `featureUsed`, `usageCount`, `customerName`
- Create a `parseAgentAdoptionCSV(text, customerName)` parser in `csv-parser.ts` that handles this format (DD-MM-YYYY dates, quoted fields)

### 2. Extend DataContext
- Add `agentAdoption: AgentAdoptionRecord[]` to `AppData`
- Add `setAgentAdoption` method to the context

### 3. New "Agent Adoption" page (`/agent-adoption`)
- Customer selector dropdown (defaults to Accela)
- **Agent leaderboard table**: Agent Name, Total Usage, Features Used, showing who is most active
- **Feature breakdown chart**: Bar chart of feature usage across all agents
- **Agent-by-feature heatmap/table**: Cross-tab of agents vs features with usage counts
- **Date trend**: Line chart showing daily usage over time
- Upload panel specific to this CSV format (with customer name input)

### 4. Add upload panel to Data Management
- New upload section for "Agent Adoption CSV" with a customer name input field (e.g., "Accela")
- Validates the Date/Agent Name/Feature Used/Usage Count columns

### 5. Navigation
- Add "Agent Adoption" nav item to the sidebar between Customer Drilldown and Reports Hub

## Technical Details

```typescript
// New type
interface AgentAdoptionRecord {
  date: Date;
  agentName: string;
  featureUsed: string;
  usageCount: number;
  customerName: string;
}
```

The parser will handle DD-MM-YYYY date format and merge multiple CSVs (e.g., Feb 14 and Feb 28 exports) into one dataset by appending without duplicating identical rows.

