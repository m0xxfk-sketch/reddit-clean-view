import { Clock, History } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { clearSeen, getBrowseHistory, getSeenIds } from "@/lib/premium-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickSub: (name: string) => void;
};

export function HistoryPanel({ open, onOpenChange, onPickSub }: Props) {
  const [history, setHistory] = useState(() => getBrowseHistory());
  const [seenCount, setSeenCount] = useState(() => getSeenIds().size);

  useEffect(() => {
    const sync = () => {
      setHistory(getBrowseHistory());
      setSeenCount(getSeenIds().size);
    };
    window.addEventListener("peek-seen", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("peek-seen", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setHistory(getBrowseHistory());
      setSeenCount(getSeenIds().size);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-border bg-surface">
        <SheetHeader>
          <SheetTitle className="font-display">History</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6 overflow-y-auto pr-2">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent subs</p>
              <History className="size-3.5 text-muted-foreground" />
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Subreddits you browse will show up here.</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 20).map((row, i) => (
                  <button
                    key={`${row.subreddit}-${row.at}-${i}`}
                    type="button"
                    onClick={() => {
                      onPickSub(row.subreddit);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-accent"
                  >
                    <span>r/{row.subreddit}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(row.at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Seen posts</p>
              <Clock className="size-3.5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {seenCount > 0
                ? `${seenCount.toLocaleString()} posts marked as seen. Toggle “Hide seen” in the bar to filter them out.`
                : "Posts you open or scroll past in feed mode are tracked here."}
            </p>
            {seenCount > 0 && (
              <button
                type="button"
                onClick={() => clearSeen()}
                className="mt-3 rounded-full border border-border px-3 py-1.5 text-xs transition hover:bg-accent"
              >
                Clear seen history
              </button>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
