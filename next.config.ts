import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Development only: the laptop's own address, so a second, separately
     signed-in browser session can be opened at 127.0.0.1 next to the one
     at localhost. Production ignores it. */
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
