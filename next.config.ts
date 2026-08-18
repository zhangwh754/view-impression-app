import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // TMDB posters
      { protocol: "https", hostname: "image.tmdb.org" },
      // Bangumi covers
      { protocol: "https", hostname: "lain.bgm.tv" },
    ],
  },
};

export default nextConfig;
