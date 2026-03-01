import { EventRecord } from "./types";

// ── Interaction Type Helpers ──

export function isClick(event: EventRecord): boolean {
  return event.event_name.startsWith("user_action:");
}

export function isPageView(event: EventRecord): boolean {
  return event.event_name.startsWith("page_view:");
}

export function isSystemLatency(event: EventRecord): boolean {
  return event.event_name.startsWith("system_latency:");
}

function getSubFeature(event: EventRecord): string {
  if (event.metadata_json) {
    try {
      const meta = JSON.parse(event.metadata_json);
      if (meta.sub_feature) return meta.sub_feature;
    } catch {}
  }
  // Fallback: extract from event_name (type:module:subfeature)
  const parts = event.event_name.split(":");
  return parts.length >= 3 ? parts.slice(2).join(":") : event.feature;
}

function getResponseTimeMs(event: EventRecord): number | null {
  if (!event.metadata_json) return null;
  try {
    const meta = JSON.parse(event.metadata_json);
    if (meta.response_time_ms != null) return Number(meta.response_time_ms);
  } catch {}
  return null;
}

// ── Feature Calculations ──

export type InteractionFilter = "all" | "clicks" | "page_views";

export interface ModuleLeaderboardEntry {
  module: string;
  totalInteractions: number;
  clicks: number;
  uniqueUsers: number;
  uniqueCases: number;
  avgLatency: number | null;
}

export function getModuleLeaderboard(
  events: EventRecord[],
  interactionFilter: InteractionFilter = "all"
): ModuleLeaderboardEntry[] {
  const filtered = applyInteractionFilter(events, interactionFilter);
  const map = new Map<string, {
    total: number; clicks: number;
    users: Set<string>; cases: Set<string>;
    latencies: number[];
  }>();

  for (const e of filtered) {
    const m = e.feature || "Unknown";
    let entry = map.get(m);
    if (!entry) { entry = { total: 0, clicks: 0, users: new Set(), cases: new Set(), latencies: [] }; map.set(m, entry); }
    entry.total++;
    if (isClick(e)) entry.clicks++;
    entry.users.add(e.user_id);
    if (e.case_id) entry.cases.add(e.case_id);
    const rt = getResponseTimeMs(e);
    if (rt !== null) entry.latencies.push(rt);
  }

  return Array.from(map.entries())
    .map(([module, v]) => ({
      module,
      totalInteractions: v.total,
      clicks: v.clicks,
      uniqueUsers: v.users.size,
      uniqueCases: v.cases.size,
      avgLatency: v.latencies.length > 0 ? Math.round(v.latencies.reduce((a, b) => a + b, 0) / v.latencies.length) : null,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

export interface SubFeatureLeaderboardEntry {
  subFeature: string;
  module: string;
  totalInteractions: number;
  clicks: number;
  uniqueUsers: number;
  uniqueCases: number;
  avgLatency: number | null;
}

export function getSubFeatureLeaderboard(
  events: EventRecord[],
  interactionFilter: InteractionFilter = "all"
): SubFeatureLeaderboardEntry[] {
  const filtered = applyInteractionFilter(events, interactionFilter);
  const map = new Map<string, {
    module: string; total: number; clicks: number;
    users: Set<string>; cases: Set<string>; latencies: number[];
  }>();

  for (const e of filtered) {
    const sf = getSubFeature(e);
    const key = `${e.feature}||${sf}`;
    let entry = map.get(key);
    if (!entry) { entry = { module: e.feature, total: 0, clicks: 0, users: new Set(), cases: new Set(), latencies: [] }; map.set(key, entry); }
    entry.total++;
    if (isClick(e)) entry.clicks++;
    entry.users.add(e.user_id);
    if (e.case_id) entry.cases.add(e.case_id);
    const rt = getResponseTimeMs(e);
    if (rt !== null) entry.latencies.push(rt);
  }

  return Array.from(map.entries())
    .map(([, v]) => {
      const parts = Array.from(map.entries()).find(([, val]) => val === v)![0].split("||");
      return {
        subFeature: parts[1],
        module: v.module,
        totalInteractions: v.total,
        clicks: v.clicks,
        uniqueUsers: v.users.size,
        uniqueCases: v.cases.size,
        avgLatency: v.latencies.length > 0 ? Math.round(v.latencies.reduce((a, b) => a + b, 0) / v.latencies.length) : null,
      };
    })
    .sort((a, b) => b.clicks - a.clicks);
}

export interface ClicksTrendEntry {
  date: string;
  clicks: number;
  pageViews: number;
  total: number;
}

export function getClicksTrend(events: EventRecord[]): ClicksTrendEntry[] {
  const map = new Map<string, { clicks: number; pageViews: number; total: number }>();
  for (const e of events) {
    const d = e.event_time.toISOString().slice(0, 10);
    let entry = map.get(d);
    if (!entry) { entry = { clicks: 0, pageViews: 0, total: 0 }; map.set(d, entry); }
    entry.total++;
    if (isClick(e)) entry.clicks++;
    if (isPageView(e)) entry.pageViews++;
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function applyInteractionFilter(events: EventRecord[], filter: InteractionFilter): EventRecord[] {
  if (filter === "clicks") return events.filter(isClick);
  if (filter === "page_views") return events.filter(isPageView);
  return events;
}

// ── Agent Calculations ──

export interface AgentLeaderboardEntry {
  userId: string;
  userName: string;
  usageScore: number;
  clicks: number;
  modulesUsed: number;
  subFeaturesUsed: number;
  casesTouched: number;
  mostUsedModule: string;
  avgLatency: number | null;
}

export function getAgentLeaderboard(events: EventRecord[]): AgentLeaderboardEntry[] {
  const map = new Map<string, {
    userName: string;
    clicks: number;
    modules: Set<string>;
    subFeatures: Set<string>;
    cases: Set<string>;
    moduleCount: Map<string, number>;
    latencies: number[];
  }>();

  for (const e of events) {
    let entry = map.get(e.user_id);
    if (!entry) {
      entry = { userName: e.user_id, clicks: 0, modules: new Set(), subFeatures: new Set(), cases: new Set(), moduleCount: new Map(), latencies: [] };
      map.set(e.user_id, entry);
    }
    if (isClick(e)) entry.clicks++;
    entry.modules.add(e.feature);
    entry.subFeatures.add(getSubFeature(e));
    if (e.case_id) entry.cases.add(e.case_id);
    entry.moduleCount.set(e.feature, (entry.moduleCount.get(e.feature) || 0) + 1);
    const rt = getResponseTimeMs(e);
    if (rt !== null) entry.latencies.push(rt);
  }

  const agents = Array.from(map.entries()).map(([userId, v]) => {
    const topModule = Array.from(v.moduleCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "–";
    return {
      userId,
      userName: v.userName,
      clicks: v.clicks,
      modulesUsed: v.modules.size,
      subFeaturesUsed: v.subFeatures.size,
      casesTouched: v.cases.size,
      mostUsedModule: topModule,
      avgLatency: v.latencies.length > 0 ? Math.round(v.latencies.reduce((a, b) => a + b, 0) / v.latencies.length) : null,
    };
  });

  // Normalize and compute score
  const maxClicks = Math.max(1, ...agents.map(a => a.clicks));
  const maxModules = Math.max(1, ...agents.map(a => a.modulesUsed));
  const maxSub = Math.max(1, ...agents.map(a => a.subFeaturesUsed));
  const maxCases = Math.max(1, ...agents.map(a => a.casesTouched));

  return agents
    .map(a => ({
      ...a,
      usageScore: Math.round(
        (a.clicks / maxClicks) * 40 +
        (a.modulesUsed / maxModules) * 30 +
        (a.subFeaturesUsed / maxSub) * 20 +
        (a.casesTouched / maxCases) * 10
      ),
    }))
    .sort((a, b) => b.usageScore - a.usageScore);
}

// ── Time-on-Case Calculations ──

export interface CaseEngagedTime {
  caseId: string;
  customerId: string;
  customerName: string;
  totalEngagedMs: number;
  burstCount: number;
  uniqueAgents: number;
  totalInteractions: number;
  topModule: string;
}

export interface AgentEngagedTime {
  userId: string;
  totalEngagedMs: number;
  avgPerCase: number;
  casesTouched: number;
}

export interface ModuleEngagedTime {
  module: string;
  totalEngagedMs: number;
  avgPerCase: number;
}

export function computeEngagedTime(
  events: EventRecord[],
  gapThresholdMinutes = 10
): CaseEngagedTime[] {
  const gapMs = gapThresholdMinutes * 60 * 1000;
  const withCase = events.filter(e => e.case_id);
  if (withCase.length === 0) return [];

  // Group by user_id + case_id
  const groups = new Map<string, EventRecord[]>();
  for (const e of withCase) {
    const key = `${e.user_id}||${e.case_id}`;
    let arr = groups.get(key);
    if (!arr) { arr = []; groups.set(key, arr); }
    arr.push(e);
  }

  // Aggregate per case
  const caseMap = new Map<string, {
    customerId: string; customerName: string;
    totalMs: number; bursts: number;
    agents: Set<string>; interactions: number;
    moduleCount: Map<string, number>;
  }>();

  for (const [, groupEvents] of groups) {
    const sorted = [...groupEvents].sort((a, b) => a.event_time.getTime() - b.event_time.getTime());
    const caseId = sorted[0].case_id!;
    
    let caseEntry = caseMap.get(caseId);
    if (!caseEntry) {
      caseEntry = {
        customerId: sorted[0].customer_id,
        customerName: sorted[0].customer_name,
        totalMs: 0, bursts: 0, agents: new Set(), interactions: 0,
        moduleCount: new Map(),
      };
      caseMap.set(caseId, caseEntry);
    }

    // Burst calculation for this user-case group
    let burstStart = sorted[0].event_time.getTime();
    let burstEnd = burstStart;
    let burstCount = 1;

    for (let i = 1; i < sorted.length; i++) {
      const t = sorted[i].event_time.getTime();
      if (t - burstEnd <= gapMs) {
        burstEnd = t;
      } else {
        caseEntry.totalMs += burstEnd - burstStart;
        burstStart = t;
        burstEnd = t;
        burstCount++;
      }
    }
    caseEntry.totalMs += burstEnd - burstStart;
    caseEntry.bursts += burstCount;
    caseEntry.agents.add(sorted[0].user_id);
    caseEntry.interactions += sorted.length;

    for (const e of sorted) {
      caseEntry.moduleCount.set(e.feature, (caseEntry.moduleCount.get(e.feature) || 0) + 1);
    }
  }

  return Array.from(caseMap.entries())
    .map(([caseId, v]) => {
      const topModule = Array.from(v.moduleCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "–";
      return {
        caseId,
        customerId: v.customerId,
        customerName: v.customerName,
        totalEngagedMs: v.totalMs,
        burstCount: v.bursts,
        uniqueAgents: v.agents.size,
        totalInteractions: v.interactions,
        topModule,
      };
    })
    .sort((a, b) => b.totalEngagedMs - a.totalEngagedMs);
}

export function getAgentEngagedTime(events: EventRecord[], gapThresholdMinutes = 10): AgentEngagedTime[] {
  const gapMs = gapThresholdMinutes * 60 * 1000;
  const withCase = events.filter(e => e.case_id);

  // Group by user_id + case_id
  const groups = new Map<string, EventRecord[]>();
  for (const e of withCase) {
    const key = `${e.user_id}||${e.case_id}`;
    let arr = groups.get(key);
    if (!arr) { arr = []; groups.set(key, arr); }
    arr.push(e);
  }

  const agentMap = new Map<string, { totalMs: number; cases: Set<string> }>();

  for (const [, groupEvents] of groups) {
    const sorted = [...groupEvents].sort((a, b) => a.event_time.getTime() - b.event_time.getTime());
    const userId = sorted[0].user_id;
    const caseId = sorted[0].case_id!;

    let entry = agentMap.get(userId);
    if (!entry) { entry = { totalMs: 0, cases: new Set() }; agentMap.set(userId, entry); }
    entry.cases.add(caseId);

    let burstStart = sorted[0].event_time.getTime();
    let burstEnd = burstStart;
    for (let i = 1; i < sorted.length; i++) {
      const t = sorted[i].event_time.getTime();
      if (t - burstEnd <= gapMs) { burstEnd = t; }
      else { entry.totalMs += burstEnd - burstStart; burstStart = t; burstEnd = t; }
    }
    entry.totalMs += burstEnd - burstStart;
  }

  return Array.from(agentMap.entries())
    .map(([userId, v]) => ({
      userId,
      totalEngagedMs: v.totalMs,
      avgPerCase: v.cases.size > 0 ? Math.round(v.totalMs / v.cases.size) : 0,
      casesTouched: v.cases.size,
    }))
    .sort((a, b) => b.totalEngagedMs - a.totalEngagedMs);
}

export function getModuleEngagedTime(events: EventRecord[], gapThresholdMinutes = 10): ModuleEngagedTime[] {
  const gapMs = gapThresholdMinutes * 60 * 1000;
  const withCase = events.filter(e => e.case_id);

  // Group by module + case_id + user_id
  const groups = new Map<string, EventRecord[]>();
  for (const e of withCase) {
    const key = `${e.feature}||${e.case_id}||${e.user_id}`;
    let arr = groups.get(key);
    if (!arr) { arr = []; groups.set(key, arr); }
    arr.push(e);
  }

  const moduleMap = new Map<string, { totalMs: number; cases: Set<string> }>();

  for (const [, groupEvents] of groups) {
    const sorted = [...groupEvents].sort((a, b) => a.event_time.getTime() - b.event_time.getTime());
    const mod = sorted[0].feature;

    let entry = moduleMap.get(mod);
    if (!entry) { entry = { totalMs: 0, cases: new Set() }; moduleMap.set(mod, entry); }
    entry.cases.add(sorted[0].case_id!);

    let burstStart = sorted[0].event_time.getTime();
    let burstEnd = burstStart;
    for (let i = 1; i < sorted.length; i++) {
      const t = sorted[i].event_time.getTime();
      if (t - burstEnd <= gapMs) { burstEnd = t; }
      else { entry.totalMs += burstEnd - burstStart; burstStart = t; burstEnd = t; }
    }
    entry.totalMs += burstEnd - burstStart;
  }

  return Array.from(moduleMap.entries())
    .map(([module, v]) => ({
      module,
      totalEngagedMs: v.totalMs,
      avgPerCase: v.cases.size > 0 ? Math.round(v.totalMs / v.cases.size) : 0,
    }))
    .sort((a, b) => b.totalEngagedMs - a.totalEngagedMs);
}

// ── Helpers ──

export function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
