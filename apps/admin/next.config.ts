import type { NextConfig } from "next";

const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

// Uploaded media is stored host-relative (`/uploads/...`) and served by the
// API. Proxy those requests to the API so image previews resolve same-origin
// in the browser. (The demo build is a static export and can't use rewrites;
// it renders bundled mock data instead.)
const API_URL = process.env.API_URL || "http://localhost:3001";

const nextConfig: NextConfig = isDemo
  ? {
      output: "export",
      trailingSlash: true,
      images: { unoptimized: true },
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
      assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
    }
  : {
      async rewrites() {
        return [
          { source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` },
        ];
      },
    };

export default nextConfig;
