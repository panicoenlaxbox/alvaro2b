import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "alvaro2b",
    short_name: "alvaro2b",
    description: "Los juegos de mesa del grupo.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#1e1b2e",
    theme_color: "#15121f",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
