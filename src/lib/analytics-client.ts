"use client";

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function compactParams(params: AnalyticsParams | undefined) {
  if (!params) return undefined;

  const entries = Object.entries(params).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function trackClientEvent(eventName: string, params?: AnalyticsParams) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = compactParams(params);

  if (window.gtag) {
    window.gtag("event", eventName, payload || {});
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...(payload || {}),
  });

  fetch("/api/conversion/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventName,
      metadata: payload,
    }),
    keepalive: true,
  }).catch(() => {
    // Non-blocking analytics call.
  });
}
