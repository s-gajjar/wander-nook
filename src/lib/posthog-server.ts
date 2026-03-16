import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

export function getPostHogServerClient(): PostHog {
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return _client;
}

const POSTHOG_API_HOST = "https://us.posthog.com";
const POSTHOG_PROJECT_ID = "344775";

export async function queryPostHog<T = unknown>(path: string): Promise<T | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${POSTHOG_API_HOST}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function postPostHog<T = unknown>(path: string, body: unknown): Promise<T | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${POSTHOG_API_HOST}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type TrendsSeries = {
  label?: string;
  data?: number[];
  count?: number;
  labels?: string[];
  days?: string[];
  aggregated_value?: number;
};

type TrendsQueryResult = {
  results?: TrendsSeries[];
};

export type PostHogDailyStat = {
  date: string;
  pageviews: number;
  visitors: number;
};

export async function fetchPostHogTrafficStats(dateFrom = "-30d"): Promise<{
  daily: PostHogDailyStat[];
  totalPageviews: number;
  totalVisitors: number;
} | null> {
  const data = await postPostHog<TrendsQueryResult>(
    `/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      query: {
        kind: "InsightVizNode",
        source: {
          kind: "TrendsQuery",
          series: [
            {
              kind: "EventsNode",
              event: "$pageview",
              custom_name: "Pageviews",
              math: "total",
            },
            {
              kind: "EventsNode",
              event: "$pageview",
              custom_name: "Unique visitors",
              math: "dau",
            },
          ],
          dateRange: { date_from: dateFrom },
          interval: "day",
        },
      },
    }
  );

  if (!data?.results || data.results.length < 2) return null;

  const pageviewSeries = data.results[0];
  const visitorSeries = data.results[1];
  const days = pageviewSeries.days || pageviewSeries.labels || [];
  const pvData = pageviewSeries.data || [];
  const uvData = visitorSeries.data || [];

  const daily: PostHogDailyStat[] = days.map((date, i) => ({
    date,
    pageviews: pvData[i] || 0,
    visitors: uvData[i] || 0,
  }));

  return {
    daily,
    totalPageviews: pvData.reduce((a, b) => a + b, 0),
    totalVisitors: uvData.reduce((a, b) => a + b, 0),
  };
}

export async function fetchPostHogTopPages(): Promise<
  Array<{ path: string; views: number }>
> {
  const data = await postPostHog<TrendsQueryResult>(
    `/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      query: {
        kind: "InsightVizNode",
        source: {
          kind: "TrendsQuery",
          series: [
            {
              kind: "EventsNode",
              event: "$pageview",
              custom_name: "Pageviews",
              math: "total",
            },
          ],
          dateRange: { date_from: "-30d" },
          breakdownFilter: {
            breakdown: "$pathname",
            breakdown_type: "event",
            breakdown_limit: 10,
          },
        },
      },
    }
  );

  if (!data?.results) return [];

  return data.results
    .map((s) => ({
      path: (s.label || "").replace("$pageview - ", ""),
      views: (s.data || []).reduce((a, b) => a + b, 0),
    }))
    .filter((p) => p.views > 0)
    .sort((a, b) => b.views - a.views);
}

export type PostHogSessionRecording = {
  id: string;
  distinctId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  activeSeconds: number;
  clickCount: number;
  keypressCount: number;
  startUrl: string;
  personName: string | null;
  viewed: boolean;
};

export async function fetchPostHogSessionRecordings(
  limit = 20
): Promise<PostHogSessionRecording[]> {
  type ApiRecording = {
    id: string;
    distinct_id: string;
    start_time: string;
    end_time: string;
    recording_duration: number;
    active_seconds: number;
    click_count: number;
    keypress_count: number;
    start_url: string;
    viewed: boolean;
    person?: {
      name?: string | null;
      distinct_ids?: string[];
    } | null;
  };

  type ApiResponse = {
    results?: ApiRecording[];
  };

  const data = await queryPostHog<ApiResponse>(
    `/api/projects/${POSTHOG_PROJECT_ID}/session_recordings/?limit=${limit}`
  );

  if (!data?.results) return [];

  return data.results.map((r) => ({
    id: r.id,
    distinctId: r.distinct_id,
    startTime: r.start_time,
    endTime: r.end_time,
    durationSeconds: r.recording_duration,
    activeSeconds: r.active_seconds,
    clickCount: r.click_count,
    keypressCount: r.keypress_count,
    startUrl: r.start_url,
    personName: r.person?.name || null,
    viewed: r.viewed,
  }));
}

// ---------------------------------------------------------------------------
// Session-level stats via HogQL (sessions count, avg duration, bounce rate)
// ---------------------------------------------------------------------------

export type PostHogSessionSummary = {
  sessions: number;
  avgDurationSeconds: number;
  bounceRate: number;
};

export async function fetchPostHogSessionSummary(): Promise<PostHogSessionSummary | null> {
  type HogQLResponse = { results?: unknown[][] };

  const data = await postPostHog<HogQLResponse>(
    `/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      query: {
        kind: "HogQLQuery",
        query: `SELECT
          count() as total_sessions,
          avg($session_duration) as avg_duration,
          countIf($pageview_count <= 1) * 100.0 / if(count() > 0, count(), 1) as bounce_rate
        FROM sessions
        WHERE $start_timestamp >= now() - interval 30 day`,
      },
    }
  );

  if (!data?.results?.[0]) return null;

  const row = data.results[0];
  return {
    sessions: Number(row[0]) || 0,
    avgDurationSeconds: Math.round(Number(row[1]) || 0),
    bounceRate: Math.round((Number(row[2]) || 0) * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Generic breakdown by any $pageview event property
// ---------------------------------------------------------------------------

export type PostHogBreakdownItem = {
  value: string;
  count: number;
};

export async function fetchPostHogBreakdown(
  property: string,
  dateFrom = "-30d",
  limit = 10
): Promise<PostHogBreakdownItem[]> {
  const data = await postPostHog<TrendsQueryResult>(
    `/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      query: {
        kind: "InsightVizNode",
        source: {
          kind: "TrendsQuery",
          series: [
            {
              kind: "EventsNode",
              event: "$pageview",
              custom_name: "Views",
              math: "total",
            },
          ],
          dateRange: { date_from: dateFrom },
          breakdownFilter: {
            breakdown: property,
            breakdown_type: "event",
            breakdown_limit: limit,
          },
        },
      },
    }
  );

  if (!data?.results) return [];

  return data.results
    .map((s) => ({
      value: String(s.label || "").replace(/^\$pageview\s*-\s*/, "") || "(unknown)",
      count: (s.data || []).reduce((a, b) => a + b, 0),
    }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Core Web Vitals via HogQL
// ---------------------------------------------------------------------------

export type PostHogWebVitals = {
  lcpMs: number | null;
  fcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
};

export async function fetchPostHogWebVitals(): Promise<PostHogWebVitals | null> {
  type HogQLResponse = { results?: unknown[][] };

  const data = await postPostHog<HogQLResponse>(
    `/api/projects/${POSTHOG_PROJECT_ID}/query/`,
    {
      query: {
        kind: "HogQLQuery",
        query: `SELECT
          avg(properties.$web_vitals_LCP_value) as lcp,
          avg(properties.$web_vitals_FCP_value) as fcp,
          avg(properties.$web_vitals_CLS_value) as cls,
          avg(properties.$web_vitals_INP_value) as inp
        FROM events
        WHERE event = '$web_vitals'
          AND timestamp >= now() - interval 30 day`,
      },
    }
  );

  if (!data?.results?.[0]) return null;

  const row = data.results[0];
  const lcp = row[0] != null ? Number(row[0]) : null;
  const fcp = row[1] != null ? Number(row[1]) : null;
  const clsVal = row[2] != null ? Number(row[2]) : null;
  const inp = row[3] != null ? Number(row[3]) : null;

  return {
    lcpMs: lcp != null && !isNaN(lcp) ? Math.round(lcp) : null,
    fcpMs: fcp != null && !isNaN(fcp) ? Math.round(fcp) : null,
    cls: clsVal != null && !isNaN(clsVal) ? Math.round(clsVal * 1000) / 1000 : null,
    inpMs: inp != null && !isNaN(inp) ? Math.round(inp) : null,
  };
}
