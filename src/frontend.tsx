import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";
import { App } from "./App.tsx";

// Absolute and subpath-safe: resolved against the current page, so it works
// both on a custom domain root and under github.io/<repo>/
const manifestUrl = new URL("tonconnect-manifest.json", window.location.href).toString();

const savedTheme = localStorage.getItem("unf-theme");
const initialTheme = savedTheme === "light" ? THEME.LIGHT : THEME.DARK;

const darkColors = {
  background: { primary: "#19191B", secondary: "#19191B", segment: "#19191B", tint: "#19191B", qr: "#FFFFFF" },
  connectButton: { background: "#0098EA", foreground: "#FFFFFF" },
};

const lightColors = {
  background: { primary: "#FFFFFF", secondary: "#F0F1F3", segment: "#FFFFFF", tint: "#F0F1F3", qr: "#F0F1F3" },
  connectButton: { background: "#0098EA", foreground: "#FFFFFF" },
};

document.documentElement.setAttribute("data-theme", savedTheme === "light" ? "light" : "dark");

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      uiPreferences={{
        theme: initialTheme,
        colorsSet: { [THEME.DARK]: darkColors, [THEME.LIGHT]: lightColors },
      }}
      analytics={{ mode: "off" }}
    >
      <App />
    </TonConnectUIProvider>
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
