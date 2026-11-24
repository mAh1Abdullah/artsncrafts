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
  async rewrites() {
    const storefrontOrigin =
      process.env.STOREFRONT_INTERNAL_URL || "http://127.0.0.1:4321";
    return {
      beforeFiles: [
        {
          source: "/storefront",
          destination: `${storefrontOrigin}/storefront`,
        },
        {
          source: "/storefront/:path*",
          destination: `${storefrontOrigin}/storefront/:path*`,
        },
        {
          source: "/_astro/:path*",
          destination: `${storefrontOrigin}/_astro/:path*`,
        },
        {
          source: "/@vite/:path*",
          destination: `${storefrontOrigin}/@vite/:path*`,
        },
        {
          source: "/@id/:path*",
          destination: `${storefrontOrigin}/@id/:path*`,
        },
        {
          source: "/@fs/:path*",
          destination: `${storefrontOrigin}/@fs/:path*`,
        },
        {
          source: "/@react-refresh",
          destination: `${storefrontOrigin}/@react-refresh`,
        },
        {
          source: "/src/:path*",
          destination: `${storefrontOrigin}/src/:path*`,
        },
        {
          source: "/node_modules/:path*",
          destination: `${storefrontOrigin}/node_modules/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
