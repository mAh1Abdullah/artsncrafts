import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@waw/contracts"],
  allowedDevOrigins: [
    "*.run.app",
    "**.run.app",
    "*.googleusercontent.com",
    "**.googleusercontent.com",
    "localhost",
    "127.0.0.1",
  ],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
