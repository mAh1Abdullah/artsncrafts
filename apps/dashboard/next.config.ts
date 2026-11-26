import path from "path";
import type { NextConfig } from "next";

const isVercel =
  process.env.VERCEL === "1" ||
  Boolean(process.env.VERCEL_ENV) ||
  Boolean(process.env.VERCEL_URL);

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: "standalone" }),
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
    if (process.env.VERCEL === "1") {
      return { beforeFiles: [] };
    }
    const storefrontOrigin = (
      process.env.STOREFRONT_URL ||
      process.env.STOREFRONT_INTERNAL_URL ||
      "http://127.0.0.1:4321"
    ).replace(/\/+$/, "");
    return {
      beforeFiles: [
        {
          source: "/",
          destination: `${storefrontOrigin}/`,
        },
        {
          source: "/raw-materials",
          destination: `${storefrontOrigin}/raw-materials`,
        },
        {
          source: "/account",
          destination: `${storefrontOrigin}/account`,
        },
        {
          source: "/sell",
          destination: `${storefrontOrigin}/sell`,
        },
        {
          source: "/products/:path*",
          destination: `${storefrontOrigin}/products/:path*`,
        },
        {
          source: "/shops/:path*",
          destination: `${storefrontOrigin}/shops/:path*`,
        },
        {
          source: "/storefront",
          destination: `${storefrontOrigin}/`,
        },
        {
          source: "/storefront/:path*",
          destination: `${storefrontOrigin}/:path*`,
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
