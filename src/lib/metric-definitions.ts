export interface MetricDefinition {
  id: string;
  name: string;
  category: "adoption" | "engagement" | "scoring" | "health";
  definition: string;
  formula?: string;
  interpretation: string;
  edgeCases?: string;
  source: string;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: "adoption_score",
    name: "Adoption Score",
    category: "adoption",
    definition: "Composite score (0–100) measuring how deeply a customer has adopted the product.",
    formula: "Reach (40%) + Frequency (30%) + Depth (30%)",
    interpretation: "Higher is better. A score above 70 indicates strong adoption.",
    edgeCases: "New customers may start low; allow 2–4 weeks ramp-up.",
    source: "Calculated from events.csv",
  },
  {
    id: "reach",
    name: "Reach",
    category: "adoption",
    definition: "Ratio of active users to licensed users.",
    formula: "active_users / licensed_users × 100",
    interpretation: "Shows penetration across the customer's licensed user base.",
    edgeCases: "If licensed_users is missing, defaults to 10.",
    source: "events.csv + customers.csv",
  },
  {
    id: "frequency",
    name: "Frequency",
    category: "adoption",
    definition: "Average number of sessions per active user, capped at 5.",
    formula: "min(sessions / active_users, 5) / 5 × 100",
    interpretation: "Measures how often users return. Capped to avoid power-user skew.",
    source: "events.csv (session_id)",
  },
  {
    id: "depth",
    name: "Depth",
    category: "adoption",
    definition: "Number of distinct core features used out of 10.",
    formula: "distinct_features / 10 × 100",
    interpretation: "Measures breadth of feature exploration.",
    source: "events.csv (feature column)",
  },
  {
    id: "momentum",
    name: "Momentum",
    category: "health",
    definition: "Week-over-week percentage change in adoption score.",
    formula: "(current_week_score - prior_week_score) / prior_week_score × 100",
    interpretation: "Positive = growth, negative = decline. Alerts trigger below -30%.",
    edgeCases: "First week shows 0% (no prior data).",
    source: "Calculated from events.csv",
  },
  {
    id: "health_badge",
    name: "Health Badge",
    category: "health",
    definition: "Traffic-light indicator of customer health.",
    formula: "Green: score ≥ 70 AND momentum ≥ 0\nAmber: score 40–69 OR momentum < 0\nRed: score < 40 OR no activity 14+ days",
    interpretation: "Red requires immediate attention; Amber is a watch signal.",
    source: "Derived from adoption score + momentum",
  },
  {
    id: "dau",
    name: "DAU (Daily Active Users)",
    category: "engagement",
    definition: "Number of distinct users active on the latest day in the date range.",
    interpretation: "Daily engagement pulse.",
    source: "events.csv (user_id, event_time)",
  },
  {
    id: "wau",
    name: "WAU (Weekly Active Users)",
    category: "engagement",
    definition: "Distinct users active in the last 7 days of the date range.",
    interpretation: "Weekly engagement breadth.",
    source: "events.csv",
  },
  {
    id: "mau",
    name: "MAU (Monthly Active Users)",
    category: "engagement",
    definition: "Distinct users active in the last 30 days of the date range.",
    interpretation: "Monthly engagement baseline.",
    source: "events.csv",
  },
  {
    id: "active_users",
    name: "Active Users",
    category: "engagement",
    definition: "Distinct users who triggered at least one event in the selected period.",
    interpretation: "Core engagement count.",
    source: "events.csv (user_id)",
  },
  {
    id: "sessions",
    name: "Sessions",
    category: "engagement",
    definition: "Distinct session IDs recorded in the selected period.",
    interpretation: "Volume of user interactions.",
    source: "events.csv (session_id)",
  },
  {
    id: "total_customers",
    name: "Total Customers",
    category: "adoption",
    definition: "Number of distinct customers with events in the selected date range.",
    interpretation: "Portfolio size for the selected filters.",
    source: "events.csv (customer_id)",
  },
  {
    id: "customers_at_risk",
    name: "Customers at Risk",
    category: "health",
    definition: "Customers with Red health: adoption score below 40 or no activity for 14+ days.",
    interpretation: "Requires proactive outreach.",
    source: "Derived from adoption score + last activity",
  },
  {
    id: "case_qa_score",
    name: "Case QA Score",
    category: "scoring",
    definition: "Overall quality score for a case evaluation.",
    formula: "Weighted sum of parameter scores in the scorecard",
    interpretation: "Higher is better. Grades: A (90+), B (80–89), C (70–79), D (<70).",
    source: "scores.csv (score_overall)",
  },
  {
    id: "case_qa_grade",
    name: "Case QA Grade",
    category: "scoring",
    definition: "Letter grade derived from the Case QA score.",
    formula: "A: ≥90, B: 80–89, C: 70–79, D: <70",
    interpretation: "Quick quality tier indicator.",
    source: "scores.csv (grade)",
  },
];

export function getMetricDefinition(id: string): MetricDefinition | undefined {
  return METRIC_DEFINITIONS.find(m => m.id === id);
}

export const METRIC_CATEGORIES = [
  { key: "adoption", label: "Adoption" },
  { key: "engagement", label: "Engagement" },
  { key: "scoring", label: "Scoring" },
  { key: "health", label: "Health" },
] as const;
