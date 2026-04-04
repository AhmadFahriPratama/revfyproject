export type AttemptTopicStat = {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
};

export type AttemptRecord = {
  id: string;
  title: string;
  slug: string;
  tier: "gratis" | "berbayar";
  category: string;
  focus: string;
  username: string;
  correct: number;
  answered: number;
  total: number;
  score: number;
  accuracy: number;
  completedAt: string;
  durationMinutes: number;
  topicBreakdown: AttemptTopicStat[];
};

const storageKey = "revfy.attempts.v1";

function normalizeTopicStat(raw: Partial<AttemptTopicStat> | undefined, fallbackTopic: string): AttemptTopicStat {
  const total = Number(raw?.total ?? 0);
  const correct = Number(raw?.correct ?? 0);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : Number(raw?.accuracy ?? 0);

  return {
    topic: String(raw?.topic ?? fallbackTopic),
    total,
    correct,
    accuracy,
  };
}

function normalizeAttempt(raw: Partial<AttemptRecord>): AttemptRecord {
  const total = Number(raw.total ?? 0);
  const correct = Number(raw.correct ?? 0);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : Number(raw.accuracy ?? 0);
  const fallbackTopic = String(raw.focus ?? raw.category ?? "General Focus");
  const topicBreakdown = Array.isArray(raw.topicBreakdown) && raw.topicBreakdown.length > 0
    ? raw.topicBreakdown.map((item) => normalizeTopicStat(item, fallbackTopic))
    : [
        {
          topic: fallbackTopic,
          total,
          correct,
          accuracy,
        },
      ];

  return {
    id: String(raw.id ?? `${raw.slug ?? "attempt"}-${Date.now()}`),
    title: String(raw.title ?? "Untitled Attempt"),
    slug: String(raw.slug ?? "unknown-set"),
    tier: raw.tier === "berbayar" ? "berbayar" : "gratis",
    category: String(raw.category ?? "General"),
    focus: String(raw.focus ?? raw.category ?? "General Focus"),
    username: String(raw.username ?? "guest"),
    correct,
    answered: Number(raw.answered ?? total),
    total,
    score: Number(raw.score ?? accuracy),
    accuracy,
    completedAt: String(raw.completedAt ?? new Date().toISOString()),
    durationMinutes: Number(raw.durationMinutes ?? 0),
    topicBreakdown,
  };
}

export function readAttempts() {
  if (typeof window === "undefined") {
    return [] as AttemptRecord[];
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return [] as AttemptRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AttemptRecord>[];
    return parsed.map(normalizeAttempt);
  } catch {
    window.localStorage.removeItem(storageKey);
    return [] as AttemptRecord[];
  }
}

export function saveAttempt(record: AttemptRecord) {
  if (typeof window === "undefined") {
    return;
  }

  const current = readAttempts();
  const next = [normalizeAttempt(record), ...current].slice(0, 24);
  window.localStorage.setItem(storageKey, JSON.stringify(next));
}
