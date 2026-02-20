function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const rawValue of candidates) {
    const value = (rawValue || "").trim();
    if (!value) continue;

    if (value.startsWith("http://") || value.startsWith("https://")) {
      return trimTrailingSlash(value);
    }

    return trimTrailingSlash(`https://${value}`);
  }

  return "http://localhost:3000";
}
