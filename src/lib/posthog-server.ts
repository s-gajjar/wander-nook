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

export async function queryPostHog<T = unknown>(path: string): Promise<T | null> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${POSTHOG_API_HOST}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type PostHogInsightResult = {
  result?: Array<{
    label?: string;
    data?: number[];
    count?: number;
    aggregated_value?: number;
  }>;
};

export type PostHogEventDefinition = {
  name: string;
  volume_30_day?: number | null;
};
