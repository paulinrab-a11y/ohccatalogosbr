import { Component, type ReactNode } from "react";
import { reportError } from "../lib/observability";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    reportError(error);
  }
  render() {
    if (this.state.failed)
      return (
        <main className="wrap py-16">
          <h1>Não foi possível carregar esta página</h1>
          <p>Tente recarregar para continuar.</p>
          <button type="button" onClick={() => location.reload()}>
            Recarregar
          </button>
        </main>
      );
    return this.props.children;
  }
}
