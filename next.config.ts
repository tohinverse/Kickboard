import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a self-contained server bundle in .next/standalone, so the runtime
  // image can skip node_modules entirely.
  output: "standalone",
};

export default nextConfig;
