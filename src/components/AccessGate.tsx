import { AgeGate } from "@/components/AgeGate";
import { PinGate } from "@/components/PinGate";

/** PIN lock first, then age verification. */
export function AccessGate({ children }: { children: React.ReactNode }) {
  return (
    <PinGate>
      <AgeGate>{children}</AgeGate>
    </PinGate>
  );
}
