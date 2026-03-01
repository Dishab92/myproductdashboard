import { EventRecord, CustomerRecord, CustomerMetrics, CohortRow, RiskAssessment, RiskTrigger, DateRange } from "./types";
import { format } from "date-fns";

// ── Cohort Analysis ──

export function computeCohortData(
  events: EventRecord[],
  customers: CustomerRecord[],
  dateRange: DateRange
): CohortRow[] {
  const customersByMonth = new Map<string, CustomerRecord[]>();

  for (const c of customers) {
    const month = format(c.go_live_date, "MMM yyyy");
    if (!customersByMonth.has(month)) customersByMonth.set(month, []);
    customersByMonth.get(month)!.push(c);
  }

  const cohorts: CohortRow[] = [];

  for (const [month, cohortCustomers] of customersByMonth) {
    const customerIds = new Set(cohortCustomers.map(c => c.customer_id));
    const cohortEvents = events.filter(e => customerIds.has(e.customer_id));

    const weeks: { week: number; score: number; activeUsersPct: number }[] = [];
    // Week 0 baseline users
    let week0Users = 0;

    for (let w = 0; w <= 12; w++) {
      let totalUsers = 0;
      let totalScore = 0;
      let customerCount = 0;

      for (const cust of cohortCustomers) {
        const goLive = cust.go_live_date.getTime();
        const weekStart = new Date(goLive + w * 7 * 86400000);
        const weekEnd = new Date(goLive + (w + 1) * 7 * 86400000);

        const weekEvents = cohortEvents.filter(
          e => e.customer_id === cust.customer_id && e.event_time >= weekStart && e.event_time < weekEnd
        );

        const activeUsers = new Set(weekEvents.map(e => e.user_id)).size;
        const sessions = new Set(weekEvents.map(e => e.session_id)).size;
        const features = new Set(weekEvents.map(e => e.feature)).size;
        const licensed = cust.licensed_users || 10;

        const reach = Math.min(activeUsers / licensed, 1) * 100;
        const freq = activeUsers > 0 ? Math.min(sessions / activeUsers / 5, 1) * 100 : 0;
        const depth = Math.min(features / 10, 1) * 100;
        const score = Math.round(reach * 0.4 + freq * 0.3 + depth * 0.3);

        totalUsers += activeUsers;
        totalScore += score;
        customerCount++;
      }

      const avgScore = customerCount > 0 ? Math.round(totalScore / customerCount) : 0;
      if (w === 0) week0Users = totalUsers;
      const activeUsersPct = week0Users > 0 ? Math.round((totalUsers / week0Users) * 100) : (w === 0 ? 100 : 0);

      weeks.push({ week: w, score: avgScore, activeUsersPct });
    }

    cohorts.push({ cohortLabel: month, goLiveMonth: month, weeks });
  }

  return cohorts.sort((a, b) => a.goLiveMonth.localeCompare(b.goLiveMonth));
}

// ── Risk Engine ──

const ACTION_MAP: Record<string, string> = {
  "no_events_14d": "Schedule urgent check-in with CS owner",
  "active_users_drop": "Investigate onboarding gaps and run re-engagement campaign",
  "single_module": "Demo additional modules; create feature adoption plan",
  "high_latency": "Escalate to engineering; review API performance",
  "trust_ratio_drop": "Review AI response quality; analyze thumbs-down patterns",
};

export function computeRiskAssessments(
  events: EventRecord[],
  customers: CustomerRecord[],
  customerMetrics: CustomerMetrics[],
  dateRange: DateRange
): RiskAssessment[] {
  const now = dateRange.to;
  const assessments: RiskAssessment[] = [];

  for (const cm of customerMetrics) {
    const triggers: RiskTrigger[] = [];
    const custEvents = events.filter(e => e.customer_id === cm.customer_id);

    // Rule 1: No events 14 days
    const daysSinceActivity = cm.lastActivity
      ? (now.getTime() - cm.lastActivity.getTime()) / 86400000
      : Infinity;
    if (daysSinceActivity > 14) {
      triggers.push({ rule: "no_events_14d", points: 30, description: `No activity for ${Math.round(daysSinceActivity)} days` });
    }

    // Rule 2: Active Users drop >40% WoW
    const weekEnd = now;
    const weekStart = new Date(now.getTime() - 7 * 86400000);
    const prevWeekStart = new Date(now.getTime() - 14 * 86400000);
    const currentWeekUsers = new Set(custEvents.filter(e => e.event_time >= weekStart && e.event_time <= weekEnd).map(e => e.user_id)).size;
    const prevWeekUsers = new Set(custEvents.filter(e => e.event_time >= prevWeekStart && e.event_time < weekStart).map(e => e.user_id)).size;
    if (prevWeekUsers > 0) {
      const dropPct = ((prevWeekUsers - currentWeekUsers) / prevWeekUsers) * 100;
      if (dropPct > 40) {
        triggers.push({ rule: "active_users_drop", points: 25, description: `Active users dropped ${Math.round(dropPct)}% WoW` });
      }
    }

    // Rule 3: Only 1 module used for 4 weeks
    const fourWeeksAgo = new Date(now.getTime() - 28 * 86400000);
    const recentEvents = custEvents.filter(e => e.event_time >= fourWeeksAgo && e.event_time <= now);
    const distinctModules = new Set(recentEvents.map(e => e.product)).size;
    if (distinctModules <= 1 && recentEvents.length > 0) {
      triggers.push({ rule: "single_module", points: 20, description: "Only 1 module used in trailing 4 weeks" });
    }

    // Rule 4: p95 latency >10000ms
    const latencies: number[] = [];
    for (const e of recentEvents) {
      if (e.metadata_json) {
        try {
          const meta = JSON.parse(e.metadata_json);
          if (meta.response_time) latencies.push(Number(meta.response_time));
        } catch {}
      }
    }
    if (latencies.length > 0) {
      latencies.sort((a, b) => a - b);
      const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
      if (p95 > 10000) {
        triggers.push({ rule: "high_latency", points: 15, description: `p95 latency ${Math.round(p95)}ms exceeds 10s threshold` });
      }
    }

    // Rule 5: Trust ratio drops >20%
    const currentThumbsUp = recentEvents.filter(e => e.event_name === "thumbs_up").length;
    const currentThumbsDown = recentEvents.filter(e => e.event_name === "thumbs_down").length;
    const eightWeeksAgo = new Date(now.getTime() - 56 * 86400000);
    const priorEvents = custEvents.filter(e => e.event_time >= eightWeeksAgo && e.event_time < fourWeeksAgo);
    const priorThumbsUp = priorEvents.filter(e => e.event_name === "thumbs_up").length;
    const priorThumbsDown = priorEvents.filter(e => e.event_name === "thumbs_down").length;
    const currentTotal = currentThumbsUp + currentThumbsDown;
    const priorTotal = priorThumbsUp + priorThumbsDown;
    if (currentTotal > 0 && priorTotal > 0) {
      const currentRatio = currentThumbsUp / currentTotal;
      const priorRatio = priorThumbsUp / priorTotal;
      const dropPct = priorRatio > 0 ? ((priorRatio - currentRatio) / priorRatio) * 100 : 0;
      if (dropPct > 20) {
        triggers.push({ rule: "trust_ratio_drop", points: 10, description: `Trust ratio dropped ${Math.round(dropPct)}%` });
      }
    }

    const riskScore = triggers.reduce((s, t) => s + t.points, 0);
    const riskLevel = riskScore >= 51 ? "High" : riskScore >= 21 ? "Medium" : "Low";
    const suggestedActions = triggers.map(t => ACTION_MAP[t.rule] || "Review customer health");

    assessments.push({
      customer_id: cm.customer_id,
      customer_name: cm.customer_name,
      riskScore,
      riskLevel,
      triggers,
      momentum: cm.momentum,
      health: cm.health,
      adoptionScore: cm.adoptionScore,
      suggestedActions,
    });
  }

  return assessments.sort((a, b) => b.riskScore - a.riskScore);
}
