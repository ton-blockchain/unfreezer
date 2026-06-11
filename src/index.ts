import { serve } from "bun";
import index from "./index.html";

const server = serve({
  port: 3001,
  routes: {
    "/*": index,

    "/tonconnect-manifest.json": async () => {
      const file = Bun.file("./public/tonconnect-manifest.json");
      return new Response(file, {
        headers: { "Content-Type": "application/json" },
      });
    },

    "/favicon.svg": async () => {
      const file = Bun.file("./public/favicon.svg");
      return new Response(file, {
        headers: { "Content-Type": "image/svg+xml" },
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
