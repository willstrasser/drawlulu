import type { NextConfig } from "next";
import createWithVercelToolbar from "@vercel/toolbar/plugins/next";

const withVercelToolbar = createWithVercelToolbar();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "fal.media",
      },
      {
        protocol: "https",
        hostname: "**.fal.ai",
      },
      {
        protocol: "https",
        hostname: "**.fal.media",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};
export default withVercelToolbar(nextConfig);
