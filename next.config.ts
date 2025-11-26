import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip URL normalization in proxy for faster execution
  skipProxyUrlNormalize: true,
  // Skip trailing slash redirect in proxy for faster execution
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
