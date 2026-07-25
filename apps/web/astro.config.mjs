import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: process.env.SITE_URL || "http://localhost:4321",
  output: "static",
  integrations: [mdx(), sitemap()],
  vite: {
    envDir: "../../",
    plugins: [tailwindcss()],
  },
});
