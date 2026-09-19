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
      // SEO files are generated and served by the API (admin: SEO & Feeds).
      // These run before dynamic routes, so [slug] never sees them.
      { source: "/sitemap.xml", destination: `${API_URL}/seo/sitemap.xml` },
      { source: "/sitemaps/:file", destination: `${API_URL}/seo/sitemaps/:file` },
      { source: "/feeds/:file", destination: `${API_URL}/seo/feeds/:file` },
      { source: "/robots.txt", destination: `${API_URL}/seo/robots.txt` },
    ];
  },
};

export default nextConfig;
