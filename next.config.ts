import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow build to succeed even if there are ESLint warnings/errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
