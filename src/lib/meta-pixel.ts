type MetaPixelParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export const META_PIXEL_ID = "2080573292785521";

function compactParams(params: MetaPixelParams | undefined) {
  if (!params) {
    return undefined;
  }

  const entries = Object.entries(params).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function trackMetaPixelEvent(eventName: string, params?: MetaPixelParams) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  const payload = compactParams(params);

  if (payload) {
    window.fbq("track", eventName, payload);
    return;
  }

  window.fbq("track", eventName);
}
