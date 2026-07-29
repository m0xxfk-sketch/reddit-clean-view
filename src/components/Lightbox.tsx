import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import type { RedditImage } from "@/lib/reddit";

export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: RedditImage[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const item = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(Math.min(index + 1, items.length - 1));
      if (e.key === "ArrowLeft") onNavigate(Math.max(index - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, items.length, onClose, onNavigate]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl"
      onClick={onClose}
    >
      <div className="flex items-start justify-between gap-6 px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{item.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            u/{item.author} · r/{item.subreddit} · {item.score.toLocaleString()} pts
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={item.permalink}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="rounded-full border border-border p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Open on Reddit"
          >
            <ExternalLink className="size-4" />
          </a>
          <button
            onClick={onClose}
            className="rounded-full border border-border p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        <img
          src={item.url}
          alt={item.title}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        />
        {index > 0 && (
          <NavButton side="left" onClick={() => onNavigate(index - 1)} />
        )}
        {index < items.length - 1 && (
          <NavButton side="right" onClick={() => onNavigate(index + 1)} />
        )}
      </div>

      <p className="pb-4 text-center text-xs tabular-nums text-muted-foreground">
        {index + 1} / {items.length}
      </p>
    </div>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Previous" : "Next"}
      className={`absolute top-1/2 -translate-y-1/2 ${side === "left" ? "left-4" : "right-4"} rounded-full border border-border bg-surface/70 p-3 text-foreground backdrop-blur transition hover:bg-surface-raised`}
    >
      <Icon className="size-5" />
    </button>
  );
}