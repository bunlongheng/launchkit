import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LaunchKit",
    short_name: "LaunchKit",
    description: "Turn your app idea into a ready-to-paste Claude Code prompt.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7fb",
    theme_color: "#f7f7fb",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
