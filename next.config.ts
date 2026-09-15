import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The app only renders remote catalog covers through next/image.
    localPatterns: [],
    remotePatterns: [
      // TMDB posters
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/t/p/w500/**",
        search: "",
      },
      // Bangumi covers
      {
        protocol: "https",
        hostname: "lain.bgm.tv",
        port: "",
        pathname: "/pic/cover/**",
        search: "",
      },
    ],
    // Covers are stable; retain each optimized result for at least 31 days.
    minimumCacheTTL: 2_678_400,
    formats: ["image/webp"],
    qualities: [70],
    // Match the rendered poster widths instead of exposing every Next.js default.
    imageSizes: [64, 112, 128, 224, 320, 384, 512],
    deviceSizes: [640],
  },
};

export default nextConfig;
