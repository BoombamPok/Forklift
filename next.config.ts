import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["130.185.249.80"],
  // Default bottom-left position collides with the sidebar's account menu.
  devIndicators: { position: "top-right" },
};

export default nextConfig;
