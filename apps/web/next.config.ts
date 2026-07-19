import type { NextConfig } from "next";

// Uploaded media is stored host-relative (`/uploads/...`) and served by the
// API. Proxy those requests to the API so a bare `/uploads/...` src resolves
// same-origin in the browser regardless of environment.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: `${API_URL}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
