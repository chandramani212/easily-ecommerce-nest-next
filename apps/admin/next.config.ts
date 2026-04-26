import type { NextConfig } from "next";

const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

const nextConfig: NextConfig = isDemo
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
      assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
    }
  : {};

export default nextConfig;
