import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Heavy native deps for background removal must not be bundled
  serverExternalPackages: ["@imgly/background-removal-node", "onnxruntime-node", "sharp"],
  // Phone access during dev: LAN IPs and the cloudflared quick tunnel
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.68.*"],
};

export default nextConfig;
