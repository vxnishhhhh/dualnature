import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dual Nature — Solar · Infrastructure · Manufacturing",
    short_name: "Dual Nature",
    description: "Certified solar, smart infrastructure and precision manufactured products in Durban & KwaZulu-Natal.",
    start_url: "/",
    display: "standalone",
    background_color: "#070A11",
    theme_color: "#070A11",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
