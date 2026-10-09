import ErrorBoundary from "./components/ErrorBoundary";
import { initMonitoring } from "./lib/observability";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./fonts.css";
import "./styles.css";
void initMonitoring();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
