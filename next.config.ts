import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @google/genai é ESM puro — webpack não consegue bundlar; precisa ser external
  serverExternalPackages: ["@google/genai", "groq-sdk"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
