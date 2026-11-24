import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server action & API gateway configuration
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
