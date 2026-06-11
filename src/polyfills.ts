import { Buffer } from "buffer";
globalThis.Buffer = globalThis.Buffer || Buffer;

// txtracer-core (emulation fallback) reads process.env at module init
(globalThis as any).process = (globalThis as any).process || { env: {} };

const link = document.createElement("link");
link.rel = "icon";
link.type = "image/svg+xml";
link.href = "/favicon.svg";
document.head.appendChild(link);
