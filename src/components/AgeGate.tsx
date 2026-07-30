import { useEffect, useState } from "react";

const KEY = "peek.age-verified";

export function AgeGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "gated" | "open">("loading");

  useEffect(() => {
    setState(localStorage.getItem(KEY) === "1" ? "open" : "gated");
  }, []);

  if (state === "loading") {
    return (
      <div className="grain flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }
  if (state === "open") return <>{children}</>;

  return (
    <div className="grain flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface/80 p-8 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Restricted</p>
        <h1 className="font-display mt-3 text-4xl leading-tight">
          This gallery contains <em>adult</em> content.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Peek is a distraction-free image reader for Reddit. By continuing you confirm you are at
          least 18 years old and that adult material is legal where you live.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              localStorage.setItem(KEY, "1");
              setState("open");
            }}
            className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            I'm 18 or older
          </button>
          <a
            href="https://www.google.com"
            className="flex-1 rounded-full border border-border px-5 py-3 text-center text-sm text-muted-foreground transition hover:bg-accent"
          >
            Leave
          </a>
        </div>
      </div>
    </div>
  );
}