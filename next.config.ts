import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default bottom-left position collides with the sidebar's account menu.
  devIndicators: { position: "top-right" },
};

export default nextConfig;
