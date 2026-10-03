import type { NextConfig } from "next";

// Uploaded media is stored host-relative (`/uploads/...`) and served by the
// API. Proxy those requests to the API so a bare `/uploads/...` src resolves
// same-origin in the browser regardless of environment.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Baseline security headers for every page. No script/style CSP — that would
// need nonces for Next's inline scripts — just the directives that are safe.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
