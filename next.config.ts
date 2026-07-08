import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the native image lib out of the bundle so its platform binary loads
  // correctly on the serverless runtime (Vercel).
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
