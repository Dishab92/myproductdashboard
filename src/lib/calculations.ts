import {
  EventRecord, CustomerRecord, CustomerMetrics, FeatureUsage,
  DailyMetric, HealthStatus
} from "./types";

export function filterEventsByDateRange(events: EventRecord[], from: Date, to: Date): EventRecord[] {
  return events.filter(e => e.event_time >= from && e.event_time <= to);
}

export function filterEventsByProduct(events: EventRecord[], product?: string): EventRecord[] {
  if (!product || product === "All") return events;
  return events.filter(e => e.product === product);
}

export function filterEventsByCustomer(events: EventRecord[], customerId?: string): EventRecord[] {
  if (!customerId) return events;
  return events.filter(e => e.customer_id === customerId);
}

export function getDistinctUsers(events: EventRecord[]): Set<string> {
  return new Set(events.map(e => e.user_id));
}

export function getDistinctSessions(events: EventRecord[]): Set<string> {
  return new Set(events.map(e => e.session_id));
}

export function getDAU(events: EventRecord[], date: Date): number {
  const dateStr = date.toISOString().slice(0, 10);
  const dayEvents = events.filter(e => e.event_time.toISOString().slice(0, 10) === dateStr);
  return getDistinctUsers(dayEvents).size;
}

export function getWAU(events: EventRecord[], endDate: Date): number {
  const start = new Date(endDate);
  start.setDate(start.getDate() - 7);
  const filtered = filterEventsByDateRange(events, start, endDate);
  return getDistinctUsers(filtered).size;
}

export function getMAU(events: EventRecord[], endDate: Date): number {
  const start = new Date(endDate);
  start.setDate(start.getDate() - 30);
  const filtered = filterEventsByDateRange(events, start, endDate);
  return getDistinctUsers(filtered).size;
}

function getDistinctFeatures(events: EventRecord[]): Set<string> {
  return new Set(events.map(e => e.feature));
}

export function calculateAdoptionScore(
  events: EventRecord[],
  licensedUsers: number
): { score: number; reach: number; frequency: number; depth: number } {
  const activeUsers = getDistinctUsers(events).size;
  const sessions = getDistinctSessions(events).size;
  const features = getDistinctFeatures(events).size;

  const reach = licensedUsers > 0
    ? Math.min(activeUsers / licensedUsers, 1) * 100
    : Math.min(activeUsers / 10, 1) * 100;

  const sessionsPerUser = activeUsers > 0 ? sessions / activeUsers : 0;
  const frequency = Math.min(sessionsPerUser / 5, 1) * 100;

  const maxFeatures = 10;
  const depth = Math.min(features / maxFeatures, 1) * 100;

  const score = Math.round(reach * 0.4 + frequency * 0.3 + depth * 0.3);
  return { score, reach: Math.round(reach), frequency: Math.round(frequency), depth: Math.round(depth) };
}

export function getHealthStatus(score: number, momentum: number, lastActivity: Date | null): HealthStatus {
  const now = new Date();
  const daysSinceActivity = lastActivity
    ? (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  if (daysSinceActivity > 14 || score < 40) return "red";
  if (score >= 70 && momentum >= 0) return "green";
  return "amber";
}

export function calculateMomentum(currentEvents: EventRecord[], prevEvents: EventRecord[], licensedUsers: number): number {
  const current = calculateAdoptionScore(currentEvents, licensedUsers).score;
  const prev = calculateAdoptionScore(prevEvents, licensedUsers).score;
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

export function getCustomerMetrics(
  events: EventRecord[],
  customers: CustomerRecord[],
  from: Date,
  to: Date
): CustomerMetrics[] {
  const customerMap = new Map(customers.map(c => [c.customer_id, c]));
  const customerIds = [...new Set(events.map(e => e.customer_id))];
  const now = to;

  // Previous period for momentum
  const periodDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
  const prevFrom = new Date(from);
  prevFrom.setDate(prevFrom.getDate() - periodDays);
  const prevTo = new Date(from);

  return customerIds.map(cid => {
    const custEvents = events.filter(e => e.customer_id === cid);
    const rangeEvents = filterEventsByDateRange(custEvents, from, to);
    const prevEvents = filterEventsByDateRange(custEvents, prevFrom, prevTo);
    const cust = customerMap.get(cid);
    const licensed = cust?.licensed_users || 10;
    const products = [...new Set(rangeEvents.map(e => e.product))];
    const { score, reach, frequency, depth } = calculateAdoptionScore(rangeEvents, licensed);
    const momentum = calculateMomentum(rangeEvents, prevEvents, licensed);
    const lastEvent = rangeEvents.length > 0
      ? new Date(Math.max(...rangeEvents.map(e => e.event_time.getTime())))
      : null;

    return {
      customer_id: cid,
      customer_name: cust?.customer_name || rangeEvents[0]?.customer_name || cid,
      product: products.join(", "),
      products,
      tier: cust?.tier || "Unknown",
      activeUsers: getDistinctUsers(rangeEvents).size,
      totalSessions: getDistinctSessions(rangeEvents).size,
      dau: getDAU(rangeEvents, now),
      wau: getWAU(rangeEvents, now),
      mau: getMAU(rangeEvents, now),
      adoptionScore: score,
      momentum,
      health: getHealthStatus(score, momentum, lastEvent),
      lastActivity: lastEvent,
      licensedUsers: licensed,
      reach,
      frequency,
      depth,
    };
  });
}

export function getFeatureUsage(events: EventRecord[]): FeatureUsage[] {
  const featureMap = new Map<string, { clicks: number; users: Set<string> }>();
  let total = 0;
  for (const e of events) {
    if (!featureMap.has(e.feature)) {
      featureMap.set(e.feature, { clicks: 0, users: new Set() });
    }
    const entry = featureMap.get(e.feature)!;
    entry.clicks++;
    entry.users.add(e.user_id);
    total++;
  }

  return Array.from(featureMap.entries())
    .map(([feature, data]) => ({
      feature,
      totalClicks: data.clicks,
      uniqueUsers: data.users.size,
      percentOfTotal: total > 0 ? Math.round((data.clicks / total) * 100) : 0,
      trend: 0,
    }))
    .sort((a, b) => b.totalClicks - a.totalClicks);
}

export function getDailyMetrics(events: EventRecord[], licensedUsers: number): DailyMetric[] {
  const dayMap = new Map<string, EventRecord[]>();
  for (const e of events) {
    const d = e.event_time.toISOString().slice(0, 10);
    if (!dayMap.has(d)) dayMap.set(d, []);
    dayMap.get(d)!.push(e);
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEvents]) => ({
      date,
      activeUsers: getDistinctUsers(dayEvents).size,
      sessions: getDistinctSessions(dayEvents).size,
      adoptionScore: calculateAdoptionScore(dayEvents, licensedUsers).score,
    }));
}

export function getPortfolioKPIs(metrics: CustomerMetrics[]) {
  return {
    totalCustomers: metrics.length,
    totalActiveUsers: metrics.reduce((s, m) => s + m.activeUsers, 0),
    avgAdoptionScore: metrics.length > 0
      ? Math.round(metrics.reduce((s, m) => s + m.adoptionScore, 0) / metrics.length)
      : 0,
    customersAtRisk: metrics.filter(m => m.health === "red").length,
  };
}
