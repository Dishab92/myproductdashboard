import { EventRecord, CustomerRecord, ScoreRecord } from "./types";

const AGENT_HELPER_CUSTOMERS = [
  { id: "ah-001", name: "JAMS Software", release: "Q3:2025", licensed: 120, cs: "Sarah Chen" },
  { id: "ah-002", name: "nCino", release: "Q2:2025", licensed: 85, cs: "Sarah Chen" },
  { id: "ah-003", name: "Accela", release: "Q1:2025", licensed: 60, cs: "Mike Ross" },
  { id: "ah-004", name: "Nozomi Networks", release: "Q3:2025", licensed: 45, cs: "Mike Ross" },
  { id: "ah-005", name: "Bluebeam", release: "Q4:2024", licensed: 55, cs: "Jen Park" },
  { id: "ah-006", name: "RainTree", release: "Yet to Go-Live", licensed: 25, cs: "Jen Park" },
  { id: "ah-007", name: "SUSE", release: "Q4:2024", licensed: 20, cs: "Mike Ross" },
  { id: "ah-008", name: "TechnologyOne", release: "Q2:2024", licensed: 15, cs: "Sarah Chen" },
  { id: "ah-009", name: "Command Alkon", release: "Yet to Go-Live", licensed: 18, cs: "Jen Park" },
];

const CASE_QA_CUSTOMERS = [
  { id: "cq-001", name: "Netskope", release: "Q3:2024", licensed: 30, cs: "Sarah Chen" },
];

const AH_FEATURE_WEIGHTS: { feature: string; weight: number; events: string[] }[] = [
  {
    feature: "Case Summary", weight: 35,
    events: ["Clicked on brief case summary", "Clicked on detailed case summary", "Time taken to generate summary"],
  },
  {
    feature: "Case Timeline", weight: 28,
    events: ["Clicked on preview icon"],
  },
  {
    feature: "Response Assist", weight: 20,
    events: [
      "Response generated on first load of response-assist", "Clicked on Response Assist tab",
      "No. of times Regenerate Response clicked", "Tonality model opened",
      "No. of times Copy to Clipboard clicked", "Tone for response assist saved",
      "Time taken to generate response",
    ],
  },
  {
    feature: "Top Articles", weight: 9,
    events: ["Clicked on Top Articles tab"],
  },
  {
    feature: "Top Related Cases", weight: 5,
    events: ["Clicked on Top Related Cases tab"],
  },
  {
    feature: "Top Experts", weight: 3,
    events: ["Clicked on Top Experts tab"],
  },
];

const CQ_FEATURES = [
  "Case Review", "Score Card", "Coaching Note", "Calibration",
  "Audit Trail", "Parameter Check", "Grade Override", "Report Export"
];

const CQ_EVENTS = [
  "case_opened", "score_submitted", "coaching_added", "calibration_started",
  "audit_viewed", "parameter_checked", "grade_overridden", "report_exported",
  "session_start", "session_end"
];

function weightedRandomFeature(rng: () => number): { feature: string; event: string } {
  const totalWeight = AH_FEATURE_WEIGHTS.reduce((s, f) => s + f.weight, 0);
  let r = rng() * totalWeight;
  for (const fw of AH_FEATURE_WEIGHTS) {
    r -= fw.weight;
    if (r <= 0) {
      return { feature: fw.feature, event: randomFrom(fw.events, rng) };
    }
  }
  const last = AH_FEATURE_WEIGHTS[AH_FEATURE_WEIGHTS.length - 1];
  return { feature: last.feature, event: randomFrom(last.events, rng) };
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randomFrom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateMockEvents(): EventRecord[] {
  const events: EventRecord[] = [];
  const rng = seededRandom(42);
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Agent Helper events
  for (const cust of AGENT_HELPER_CUSTOMERS) {
    const userCount = Math.floor(cust.licensed * (0.3 + rng() * 0.5));
    const users = Array.from({ length: userCount }, (_, i) => `${cust.id}-u${i + 1}`);
    const dailyActivity = cust.licensed >= 80 ? 0.85 : cust.licensed >= 40 ? 0.7 : 0.5;
    
    for (let d = new Date(sixMonthsAgo); d <= now; d.setDate(d.getDate() + 1)) {
      if (rng() > dailyActivity) continue;
      const dayUsers = users.filter(() => rng() < (0.2 + rng() * 0.3));
      
      for (const uid of dayUsers) {
        const sessionId = `s-${cust.id}-${d.toISOString().slice(0, 10)}-${uid}-${Math.floor(rng() * 1000)}`;
        const eventsPerSession = 3 + Math.floor(rng() * 12);
        
        for (let e = 0; e < eventsPerSession; e++) {
          const hour = 8 + Math.floor(rng() * 10);
          const min = Math.floor(rng() * 60);
          const eventTime = new Date(d);
          eventTime.setHours(hour, min, Math.floor(rng() * 60));
          
          const { feature, event: eventName } = weightedRandomFeature(rng);
          
          events.push({
            event_time: new Date(eventTime),
            customer_id: cust.id,
            customer_name: cust.name,
            product: "Agent Helper",
            user_id: uid,
            session_id: sessionId,
            event_name: eventName,
            feature: feature,
          });
        }
      }
    }
  }

  // Case QA events
  for (const cust of CASE_QA_CUSTOMERS) {
    const userCount = Math.floor(cust.licensed * (0.4 + rng() * 0.4));
    const users = Array.from({ length: userCount }, (_, i) => `${cust.id}-u${i + 1}`);
    
    for (let d = new Date(sixMonthsAgo); d <= now; d.setDate(d.getDate() + 1)) {
      if (rng() > 0.75) continue;
      const dayUsers = users.filter(() => rng() < 0.5);
      
      for (const uid of dayUsers) {
        const sessionId = `s-${cust.id}-${d.toISOString().slice(0, 10)}-${uid}-${Math.floor(rng() * 1000)}`;
        const eventsPerSession = 2 + Math.floor(rng() * 8);
        
        for (let e = 0; e < eventsPerSession; e++) {
          const hour = 9 + Math.floor(rng() * 8);
          const eventTime = new Date(d);
          eventTime.setHours(hour, Math.floor(rng() * 60));
          
          events.push({
            event_time: new Date(eventTime),
            customer_id: cust.id,
            customer_name: cust.name,
            product: "Case QA",
            user_id: uid,
            session_id: sessionId,
            event_name: randomFrom(CQ_EVENTS, rng),
            feature: randomFrom(CQ_FEATURES, rng),
            case_id: `case-${Math.floor(rng() * 10000)}`,
          });
        }
      }
    }
  }

  return events;
}

export function generateMockCustomers(): CustomerRecord[] {
  const all = [...AGENT_HELPER_CUSTOMERS, ...CASE_QA_CUSTOMERS];
  const seen = new Set<string>();
  return all.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  }).map((c, i) => ({
    customer_id: c.id,
    customer_name: c.name,
    release: c.release,
    go_live_date: new Date(2024, 2 + i, 1 + i * 3),
    licensed_users: c.licensed,
    cs_owner: c.cs,
  }));
}

export function generateMockScores(): ScoreRecord[] {
  const scores: ScoreRecord[] = [];
  const rng = seededRandom(99);
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  for (let d = new Date(threeMonthsAgo); d <= now; d.setDate(d.getDate() + 1)) {
    if (rng() > 0.7) continue;
    const casesPerDay = 2 + Math.floor(rng() * 6);
    for (let c = 0; c < casesPerDay; c++) {
      const score = 40 + Math.floor(rng() * 55);
      const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
      scores.push({
        event_time: new Date(d),
        customer_id: "cq-001",
        case_id: `case-${Math.floor(rng() * 50000)}`,
        score_overall: score,
        grade,
      });
    }
  }
  return scores;
}
