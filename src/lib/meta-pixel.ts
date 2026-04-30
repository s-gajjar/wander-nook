type MetaPixelScalar = string | number | boolean | null | undefined;
type MetaPixelParams = Record<string, MetaPixelScalar | Array<string | number>>;
type MetaPixelOptions = {
  eventID?: string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "2080573292785521";

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

export function trackMetaPixelEvent(
  eventName: string,
  params?: MetaPixelParams,
  options?: MetaPixelOptions
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  const payload = compactParams(params);
  const eventOptions = compactParams(options);

  if (payload && eventOptions) {
    window.fbq("track", eventName, payload, eventOptions);
    return;
  }

  if (payload) {
    window.fbq("track", eventName, payload);
    return;
  }

  if (eventOptions) {
    window.fbq("track", eventName, {}, eventOptions);
    return;
  }

  window.fbq("track", eventName);
}
