import { Dices } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GENRE_ORDER,
  NSFW_GENRE_LABELS,
  getNsfwTopSubreddits,
  type NsfwCategory,
  type NsfwSubreddit,
} from "@/lib/nsfw-subreddits";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickSub: (name: string) => void;
};

type Phase = "idle" | "spinning" | "result";

const SPIN_MS = 2200;

export function GenreRouletteDialog({ open, onOpenChange, onPickSub }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [highlight, setHighlight] = useState(0);
  const [result, setResult] = useState<{ genre: NsfwCategory; sub: NsfwSubreddit } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setPhase("idle");
    setResult(null);
    setHighlight(0);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const spin = () => {
    if (phase === "spinning") return;
    setPhase("spinning");
    setResult(null);

    const genre = GENRE_ORDER[Math.floor(Math.random() * GENRE_ORDER.length)]!;
    const subs = getNsfwTopSubreddits({ category: genre });
    const sub = subs[Math.floor(Math.random() * subs.length)] ?? subs[0];

    if (!sub) {
      setPhase("idle");
      return;
    }

    let tick = 0;
    const maxTicks = 18;
    timer.current = setInterval(() => {
      setHighlight((h) => (h + 1) % GENRE_ORDER.length);
      tick++;
      if (tick >= maxTicks) {
        if (timer.current) clearInterval(timer.current);
        setHighlight(GENRE_ORDER.indexOf(genre));
        setResult({ genre, sub });
        setPhase("result");
      }
    }, SPIN_MS / maxTicks);
  };

  const go = () => {
    if (!result) return;
    onPickSub(result.sub.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Dices className="size-4 text-primary" />
            Genre roulette
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Spin to land on a random genre, then jump into a subreddit from that category.
        </p>

        <div className="mt-2 grid grid-cols-3 gap-2">
          {GENRE_ORDER.map((genre, i) => (
            <div
              key={genre}
              className={`rounded-lg border px-2 py-2 text-center text-xs transition ${
                phase === "spinning" && highlight === i
                  ? "border-primary bg-primary/15 text-primary"
                  : result?.genre === genre
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground"
              }`}
            >
              {NSFW_GENRE_LABELS[genre]}
            </div>
          ))}
        </div>

        {phase === "result" && result && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-primary">
              {NSFW_GENRE_LABELS[result.genre]}
            </p>
            <p className="mt-1 font-display text-xl">r/{result.sub.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{result.sub.label}</p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {phase !== "result" ? (
            <button
              type="button"
              onClick={spin}
              disabled={phase === "spinning"}
              className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {phase === "spinning" ? "Spinning…" : "Spin"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={spin}
                className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm transition hover:bg-surface-raised"
              >
                Spin again
              </button>
              <button
                type="button"
                onClick={go}
                className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Go to sub
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
