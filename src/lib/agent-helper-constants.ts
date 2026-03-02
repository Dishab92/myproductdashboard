export const AH_STATUSES = [
  "Complete", "In Development", "In QA", "To Do",
  "Grooming to be planned", "In Story writing", "On Hold",
  "To be planned for dev", "In Review",
] as const;

export const AH_FEATURE_TYPES = [
  "New Feature", "UX Improvement", "Analytics and Reporting",
  "Enhancement/Optimization", "Relevance", "Technical Debt",
] as const;

export const AH_FEATURE_SOURCES = [
  "Product", "Customer Request", "CSM", "Sales", "Executive", "Technical Debt",
] as const;

export const AH_PRIORITIES = ["P0", "P1", "P2", "P3"] as const;

export const AH_TARGET_BUCKETS = [
  "Nov Release", "Dec Release", "Jan Q1 2026", "Feb 2026",
  "March 2026", "April 2026", "Future",
] as const;

export const SCORE_DIMENSIONS = [
  { key: "score_common_customer_ask", label: "Common Customer Ask", shortLabel: "Customer Ask", defaultWeight: 30 },
  { key: "score_competitor_market_research", label: "Competitor Analysis + Market Research", shortLabel: "Competitor/Market", defaultWeight: 30 },
  { key: "score_seller_prospect_input", label: "Seller Input + Prospect Ask", shortLabel: "Seller/Prospect", defaultWeight: 15 },
  { key: "score_technical_debt", label: "Technical Debt", shortLabel: "Tech Debt", defaultWeight: 15 },
  { key: "score_executive_input", label: "Executive Input", shortLabel: "Executive", defaultWeight: 10 },
] as const;

export const WEIGHT_KEYS = [
  "w_common_customer_ask", "w_competitor_market_research",
  "w_seller_prospect_input", "w_technical_debt", "w_executive_input",
] as const;

export interface ScoringWeights {
  w_common_customer_ask: number;
  w_competitor_market_research: number;
  w_seller_prospect_input: number;
  w_technical_debt: number;
  w_executive_input: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  w_common_customer_ask: 30,
  w_competitor_market_research: 30,
  w_seller_prospect_input: 15,
  w_technical_debt: 15,
  w_executive_input: 10,
};

export type ScoreFields = Pick<
  import("@/components/roadmap/RoadmapCard").RoadmapItem,
  "score_common_customer_ask" | "score_competitor_market_research" | "score_seller_prospect_input" | "score_technical_debt" | "score_executive_input"
>;

export function computeWeightedScore(
  scores: ScoreFields,
  weights: ScoringWeights
): number {
  return (
    (scores.score_common_customer_ask / 5) * 100 * (weights.w_common_customer_ask / 100) +
    (scores.score_competitor_market_research / 5) * 100 * (weights.w_competitor_market_research / 100) +
    (scores.score_seller_prospect_input / 5) * 100 * (weights.w_seller_prospect_input / 100) +
    (scores.score_technical_debt / 5) * 100 * (weights.w_technical_debt / 100) +
    (scores.score_executive_input / 5) * 100 * (weights.w_executive_input / 100)
  );
}

export function getScoreBreakdown(
  scores: ScoreFields,
  weights: ScoringWeights
): { label: string; raw: number; weight: number; contribution: number }[] {
  return SCORE_DIMENSIONS.map((d) => {
    const raw = scores[d.key as keyof ScoreFields] || 0;
    const wKey = `w_${d.key.replace("score_", "")}` as keyof ScoringWeights;
    const weight = weights[wKey];
    const contribution = (raw / 5) * 100 * (weight / 100);
    return { label: d.shortLabel, raw, weight, contribution };
  });
}

export const STATUS_COLORS: Record<string, string> = {
  "Complete": "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "In Development": "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "In QA": "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "To Do": "bg-muted text-muted-foreground border-border",
  "Grooming to be planned": "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "In Story writing": "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "On Hold": "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
  "To be planned for dev": "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
  "In Review": "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30",
};

export const FEATURE_TYPE_COLORS: Record<string, string> = {
  "New Feature": "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "UX Improvement": "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "Analytics and Reporting": "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "Enhancement/Optimization": "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "Relevance": "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "Technical Debt": "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
};

export const FEATURE_SOURCE_COLORS: Record<string, string> = {
  "Product": "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "Customer Request": "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "CSM": "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "Sales": "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "Executive": "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30",
  "Technical Debt": "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
};
