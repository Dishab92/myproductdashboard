export interface EventRecord {
  event_time: Date;
  customer_id: string;
  customer_name: string;
  product: "Agent Helper" | "Case QA";
  user_id: string;
  session_id: string;
  event_name: string;
  feature: string;
  case_id?: string;
  channel?: string;
  metadata_json?: string;
}

export interface CustomerRecord {
  customer_id: string;
  customer_name: string;
  release: string;
  go_live_date: Date;
  licensed_users: number;
  cs_owner: string;
}

export interface ScoreRecord {
  event_time: Date;
  customer_id: string;
  case_id: string;
  score_overall: number;
  grade: string;
  parameters_json?: string;
}

export type HealthStatus = "green" | "amber" | "red";

export interface CustomerMetrics {
  customer_id: string;
  customer_name: string;
  product: string;
  products: string[];
  release: string;
  activeUsers: number;
  totalSessions: number;
  dau: number;
  wau: number;
  mau: number;
  adoptionScore: number;
  momentum: number;
  health: HealthStatus;
  lastActivity: Date | null;
  licensedUsers: number;
  reach: number;
  frequency: number;
  depth: number;
}

export interface FeatureUsage {
  feature: string;
  totalClicks: number;
  uniqueUsers: number;
  percentOfTotal: number;
  trend: number;
}

export interface DailyMetric {
  date: string;
  activeUsers: number;
  sessions: number;
  adoptionScore: number;
}

export interface AgentAdoptionRecord {
  date: Date;
  agentName: string;
  featureUsed: string;
  usageCount: number;
  customerName: string;
}

export interface TenantConfig {
  tenant_id: string;
  customer_name: string;
  go_live_date: Date | null;
  stage: string;
}

export interface AppData {
  events: EventRecord[];
  customers: CustomerRecord[];
  scores: ScoreRecord[];
  agentAdoption: AgentAdoptionRecord[];
  tenantConfig: TenantConfig[];
  lastUpload: Date | null;
}

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

export interface CohortWeek {
  week: number;
  score: number;
  activeUsersPct: number;
}

export interface CohortRow {
  cohortLabel: string;
  goLiveMonth: string;
  weeks: CohortWeek[];
}

export interface RiskTrigger {
  rule: string;
  points: number;
  description: string;
}

export interface RiskAssessment {
  customer_id: string;
  customer_name: string;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  triggers: RiskTrigger[];
  momentum: number;
  health: HealthStatus;
  adoptionScore: number;
  suggestedActions: string[];
}
