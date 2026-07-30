import { Component, useEffect, useState, type ReactNode } from "react";

import { PinGate } from "@/components/PinGate";

type Props = { children: ReactNode };
type State = { crashed: boolean };

/** Fallback if PIN UI crashes — lets the app load instead of a blank screen. */
class PinGateBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: Error) {
    console.error("PinGate crashed:", error);
  }

  render() {
    if (this.state.crashed) return this.props.children;
    return <PinGate>{this.props.children}</PinGate>;
  }
}

/** Avoid SSR/hydration mismatch — gate only runs after client mount. */
function ClientAccessGate({ children }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="grain min-h-screen bg-background" aria-hidden />;
  }

  return <PinGateBoundary>{children}</PinGateBoundary>;
}

/** Single access gate: PIN lock with 18+ confirmation on first setup. */
export function AccessGate({ children }: Props) {
  return <ClientAccessGate>{children}</ClientAccessGate>;
}
