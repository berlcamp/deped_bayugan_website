import type { NextConfig } from "next";

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co").hostname;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Two root layouts (site + admin) — this renders 404s for URLs neither one matches.
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
  turbopack: {
    rules: {
      // Only the admin stylesheet uses Tailwind. A "*.css" rule would also catch the CSS
      // that next/font generates and break it in dev.
      "admin.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
