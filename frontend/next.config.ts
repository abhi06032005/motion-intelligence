import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output in Linux/Docker environments; skip symlinks on Windows host builds
  output: process.env.NEXT_STANDALONE === "true" || process.platform !== "win32" ? "standalone" : undefined,
};

export default nextConfig;
