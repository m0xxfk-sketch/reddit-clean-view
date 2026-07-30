import { Lock, Delete } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  fetchPinStatus,
  hasLocalPin,
  isLocallyUnlocked,
  setLocalPin,
  unlockLocally,
  verifyLocalPin,
  verifyPinWithServer,
} from "@/lib/pin-auth-client";

type GateState = "loading" | "setup" | "locked" | "open";
type PinMode = "server" | "client";

const MIN_LEN = 4;
const MAX_LEN = 8;
const DOTS = 4;

export function PinGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("loading");
  const [mode, setMode] = useState<PinMode>("client");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setupStep, setSetupStep] = useState<"create" | "confirm">("create");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPinStatus().then((status) => {
      setMode(status.mode);
      if (status.mode === "server") {
        setState(status.unlocked ? "open" : "locked");
        return;
      }
      if (!hasLocalPin()) {
        setState("setup");
        return;
      }
      setState(isLocallyUnlocked() ? "open" : "locked");
    });
  }, []);

  const fail = useCallback((message: string) => {
    setError(message);
    setShake(true);
    setPin("");
    setTimeout(() => setShake(false), 450);
  }, []);

  const unlock = useCallback(() => {
    setError("");
    setPin("");
    setState("open");
  }, []);

  const submitPin = useCallback(async () => {
    if (pin.length < MIN_LEN) {
      fail(`Enter at least ${MIN_LEN} digits.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (mode === "server") {
        const ok = await verifyPinWithServer(pin);
        if (!ok) {
          fail("Wrong PIN. Try again.");
          return;
        }
        unlock();
        return;
      }

      const ok = await verifyLocalPin(pin);
      if (!ok) {
        fail("Wrong PIN. Try again.");
        return;
      }
      unlockLocally(remember);
      unlock();
    } finally {
      setSubmitting(false);
    }
  }, [fail, mode, pin, remember, unlock]);

  const submitSetup = useCallback(async () => {
    if (setupStep === "create") {
      if (pin.length < MIN_LEN) {
        fail(`PIN must be at least ${MIN_LEN} digits.`);
        return;
      }
      setConfirmPin(pin);
      setPin("");
      setSetupStep("confirm");
      setError("");
      return;
    }

    if (pin !== confirmPin) {
      fail("PINs don't match. Try again.");
      setSetupStep("create");
      setConfirmPin("");
      return;
    }

    await setLocalPin(pin);
    unlockLocally(remember);
    setPin("");
    setConfirmPin("");
    unlock();
  }, [confirmPin, fail, pin, remember, setupStep, unlock]);

  const pushDigit = (digit: string) => {
    if (submitting) return;
    setError("");
    setPin((p) => (p.length >= MAX_LEN ? p : p + digit));
  };

  const popDigit = () => {
    if (submitting) return;
    setError("");
    setPin((p) => p.slice(0, -1));
  };

  useEffect(() => {
    if (state !== "locked" && state !== "setup") return;
    if (pin.length < MIN_LEN) return;

    const timer = setTimeout(() => {
      if (state === "locked") submitPin();
      else submitSetup();
    }, 280);

    return () => clearTimeout(timer);
  }, [pin, state, submitPin, submitSetup]);

  if (state === "loading") {
    return (
      <div className="grain flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (state === "open") return <>{children}</>;

  const isSetup = state === "setup";
  const title = isSetup
    ? setupStep === "create"
      ? "Create your PIN"
      : "Confirm your PIN"
    : "Enter PIN";
  const subtitle = isSetup
    ? setupStep === "create"
      ? "Choose a PIN to lock Peek. You'll need it every time you open the app."
      : "Enter the same PIN again to confirm."
    : mode === "server"
      ? "This gallery is PIN-protected."
      : "Enter your PIN to unlock Peek.";

  return (
    <div className="grain flex min-h-screen items-center justify-center px-6">
      <div
        className={`w-full max-w-sm rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur-xl ${
          shake ? "animate-[shake_0.45s_ease-in-out]" : ""
        }`}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Lock className="size-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Locked</p>
            <h1 className="font-display text-2xl leading-tight">{title}</h1>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>

        <PinDots length={pin.length} />

        {error && <p className="mt-3 text-center text-xs text-destructive">{error}</p>}

        {!isSetup && (
          <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-border"
            />
            Remember for 7 days
          </label>
        )}

        <Numpad onDigit={pushDigit} onDelete={popDigit} disabled={submitting} />

        {isSetup && setupStep === "confirm" && (
          <button
            type="button"
            onClick={() => {
              setSetupStep("create");
              setPin("");
              setConfirmPin("");
              setError("");
            }}
            className="mt-4 w-full text-center text-xs text-muted-foreground transition hover:text-foreground"
          >
            Start over
          </button>
        )}
      </div>
    </div>
  );
}

function PinDots({ length }: { length: number }) {
  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length: DOTS }, (_, i) => (
        <span
          key={i}
          className={`size-3 rounded-full border transition ${
            i < Math.min(length, DOTS) ? "scale-110 border-primary bg-primary" : "border-border bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

function Numpad({
  onDigit,
  onDelete,
  disabled,
}: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="mt-6 grid grid-cols-3 gap-2">
      {keys.map((key, i) => {
        if (key === "") return <span key={i} />;
        if (key === "del") {
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={onDelete}
              aria-label="Delete"
              className="flex h-14 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-accent disabled:opacity-50"
            >
              <Delete className="size-5" />
            </button>
          );
        }
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onDigit(key)}
            className="h-14 rounded-xl border border-border text-lg font-medium transition hover:border-primary/40 hover:bg-accent disabled:opacity-50"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
