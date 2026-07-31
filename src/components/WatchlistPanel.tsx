import { Bookmark, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getWatchlist,
  removeFromWatchlist,
  type WatchlistEntry,
} from "@/lib/premium-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickSub: (name: string) => void;
};

export function WatchlistPanel({ open, onOpenChange, onPickSub }: Props) {
  const [list, setList] = useState<WatchlistEntry[]>(() => getWatchlist());

  useEffect(() => {
    const sync = () => setList(getWatchlist());
    window.addEventListener("storage", sync);
    window.addEventListener("peek-watchlist", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("peek-watchlist", sync);
    };
  }, []);

  useEffect(() => {
    if (open) setList(getWatchlist());
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-border bg-surface">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <Bookmark className="size-4 text-primary" />
            Sub watchlist
          </SheetTitle>
        </SheetHeader>
        <p className="mt-2 text-xs text-muted-foreground">
          Save subreddits to browse later. Add the current sub from the toolbar bookmark button.
        </p>
        <div className="mt-4 space-y-2 overflow-y-auto pr-2">
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No subs saved yet. Bookmark a subreddit while browsing to queue it here.
            </p>
          )}
          {list.map((entry) => (
            <div
              key={entry.sub}
              className="flex items-center gap-2 rounded-lg border border-border bg-background/50 p-3"
            >
              <button
                type="button"
                onClick={() => {
                  onPickSub(entry.sub);
                  onOpenChange(false);
                }}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium">r/{entry.sub}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(entry.added).toLocaleDateString()}
                </p>
              </button>
              <button
                type="button"
                aria-label={`Remove r/${entry.sub}`}
                onClick={() => removeFromWatchlist(entry.sub)}
                className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
