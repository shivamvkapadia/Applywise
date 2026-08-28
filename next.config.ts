import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Node-only parsers out of the bundler; they run in route handlers.
  serverExternalPackages: ["jsdom", "unpdf", "mammoth", "@prisma/client"],
};

export default nextConfig;
