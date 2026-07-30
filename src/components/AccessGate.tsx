import { Component, type ReactNode } from "react";

import { AgeGate } from "@/components/AgeGate";
import { PinGate } from "@/components/PinGate";

type Props = { children: ReactNode };
type State = { crashed: boolean };

/** PIN lock first, then age verification — with a fallback if PIN UI crashes. */
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

export function AccessGate({ children }: Props) {
  return (
    <PinGateBoundary>
      <AgeGate>{children}</AgeGate>
    </PinGateBoundary>
  );
}
