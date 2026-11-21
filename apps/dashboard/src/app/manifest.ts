import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WAW-POS & Marketplace Operations",
    short_name: "WAW-POS",
    description:
      "Offline-first retail POS register, Seller Studio, Marketplace Admin, and Shipping Logistics platform.",
    start_url: "/pos",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#0F172A",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
