import { CustomerMetrics, RiskAssessment, CohortRow } from "./types";

export interface InsightDetail {
  label: string;
  value: string;
}

export interface Insight {
  id: string;
  title: string;
  explanation: string;
  confidence: "High" | "Medium" | "Low";
  priority: "high" | "growth" | "optimization";
  details: InsightDetail[];
}

export function generateInsights(
  metrics: CustomerMetrics[],
  riskAssessments: RiskAssessment[],
  cohortData: CohortRow[]
): Insight[] {
  const insights: Insight[] = [];

  // Rule 1: Risk score > 50 for any customer → High priority
  const highRiskCustomers = riskAssessments.filter(r => r.riskScore > 50);
  if (highRiskCustomers.length > 0) {
    const top = highRiskCustomers[0];
    insights.push({
      id: "high_risk",
      title: "Critical Risk Detected",
      explanation: `${top.customer_name} has a risk score of ${top.riskScore}. ${highRiskCustomers.length > 1 ? `${highRiskCustomers.length - 1} other account(s) also flagged.` : "Immediate attention recommended."}`,
      confidence: "High",
      priority: "high",
      details: highRiskCustomers.slice(0, 3).map(r => ({
        label: r.customer_name,
        value: `Risk: ${r.riskScore} | Triggers: ${r.triggers.map(t => t.rule).join(", ")}`,
      })),
    });
  }

  // Rule 2: Active users drop > 30% WoW → High priority
  const droppingUsers = metrics.filter(m => m.momentum < -30);
  if (droppingUsers.length > 0) {
    const worst = droppingUsers.sort((a, b) => a.momentum - b.momentum)[0];
    insights.push({
      id: "active_users_drop",
      title: "Significant User Drop",
      explanation: `${worst.customer_name} saw a ${Math.abs(worst.momentum)}% WoW decline in adoption. ${droppingUsers.length > 1 ? `${droppingUsers.length} accounts affected total.` : "Investigate immediately."}`,
      confidence: "High",
      priority: "high",
      details: droppingUsers.slice(0, 3).map(m => ({
        label: m.customer_name,
        value: `Momentum: ${m.momentum}% | Active Users: ${m.activeUsers}`,
      })),
    });
  }

  // Rule 3: Adoption increase > 15% WoW → Growth
  const growing = metrics.filter(m => m.momentum > 15);
  if (growing.length > 0) {
    const best = growing.sort((a, b) => b.momentum - a.momentum)[0];
    insights.push({
      id: "adoption_surge",
      title: "Adoption Surge",
      explanation: `${best.customer_name} grew ${best.momentum}% WoW. ${growing.length > 1 ? `${growing.length} accounts showing strong growth momentum.` : "Capitalize on this trend with deeper feature enablement."}`,
      confidence: "High",
      priority: "growth",
      details: growing.slice(0, 3).map(m => ({
        label: m.customer_name,
        value: `Momentum: +${m.momentum}% | Score: ${m.adoptionScore}`,
      })),
    });
  }

  // Rule 4: Single module usage → Optimization
  const singleModule = metrics.filter(m => m.products && m.products.length <= 1);
  if (singleModule.length > 0) {
    insights.push({
      id: "breadth_limitation",
      title: "Feature Breadth Limitation",
      explanation: `${singleModule.length} account(s) consistently use only one module. Cross-module adoption could deepen engagement and reduce churn risk.`,
      confidence: "Medium",
      priority: "optimization",
      details: singleModule.slice(0, 3).map(m => ({
        label: m.customer_name,
        value: `Module: ${m.products?.[0] || m.product} | Score: ${m.adoptionScore}`,
      })),
    });
  }

  // Rule 5: Cohort plateau after Week 2 → Optimization
  for (const cohort of cohortData) {
    if (cohort.weeks.length > 4) {
      const w2 = cohort.weeks.find(w => w.week === 2);
      const w4 = cohort.weeks.find(w => w.week === 4);
      if (w2 && w4 && w4.score <= w2.score && w2.score > 0) {
        insights.push({
          id: `cohort_plateau_${cohort.goLiveMonth}`,
          title: "Onboarding Plateau Detected",
          explanation: `The ${cohort.cohortLabel} cohort flatlined after Week 2 (score ${w2.score} → ${w4.score}). Consider enhancing post-onboarding enablement.`,
          confidence: "Medium",
          priority: "optimization",
          details: [
            { label: "Cohort", value: cohort.cohortLabel },
            { label: "Week 2 Score", value: `${w2.score}` },
            { label: "Week 4 Score", value: `${w4.score}` },
          ],
        });
        break; // Only one cohort plateau insight
      }
    }
  }

  // Sort: high → growth → optimization, cap at 5
  const priorityOrder = { high: 0, growth: 1, optimization: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights.slice(0, 5);
}
