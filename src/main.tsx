import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

// IMPORTANT: Capture PWA install prompt BEFORE React mounts
import "./lib/pwa-prompt";

// Ensure service worker is registered in production builds (required for PWA install prompt)
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
});

createRoot(document.getElementById("root")!).render(<App />);
