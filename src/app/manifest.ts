import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DepEd Bayugan",
    short_name: "DepEd Bayugan",
    description: "Schools Division of Bayugan City",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#0a2a5e",
    icons: [{ src: "/logos/deped.png", sizes: "480x480", type: "image/png" }],
  };
}
