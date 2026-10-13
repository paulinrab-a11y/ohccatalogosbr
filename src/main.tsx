import ErrorBoundary from "./components/ErrorBoundary";
import { initMonitoring } from "./lib/observability";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { captureRef } from "./lib/attribution";
import "./fonts.css";
import "./styles.css";
void initMonitoring();
// Before the first render, so the very first WhatsApp link already carries
// the campaign reference of the ad that opened the site.
captureRef(new URLSearchParams(location.search));
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
