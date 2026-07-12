import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Heavy native deps for background removal must not be bundled
  serverExternalPackages: ["@imgly/background-removal-node", "onnxruntime-node", "sharp"],
};

export default nextConfig;
