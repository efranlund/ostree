import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip URL normalization in middleware for faster execution
  skipMiddlewareUrlNormalize: true,
  // Skip trailing slash redirect in middleware for faster execution
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
