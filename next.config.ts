import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Keep the private portal + auth routes out of search indexes.
    const noindex = {
      key: "X-Robots-Tag",
      value: "noindex, nofollow",
    };
    return [
      { source: "/dashboard/:path*", headers: [noindex] },
      { source: "/client/:path*", headers: [noindex] },
      { source: "/login", headers: [noindex] },
      { source: "/client-register", headers: [noindex] },
      { source: "/forgot-password", headers: [noindex] },
      { source: "/reset-password", headers: [noindex] },
    ];
  },
};

export default nextConfig;
