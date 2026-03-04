import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.orbis.co.jp" },
    ],
  },
};

export default nextConfig;
