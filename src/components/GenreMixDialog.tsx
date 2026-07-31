import { Blend } from "lucide-react";

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
} from "@/lib/nsfw-subreddits";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickGenreMix: (genre: NsfwCategory, subs: string[]) => void;
};

export function GenreMixDialog({ open, onOpenChange, onPickGenreMix }: Props) {
  const pick = (genre: NsfwCategory) => {
    const subs = getNsfwTopSubreddits({ category: genre, limit: 5 }).map((s) => s.name);
    if (!subs.length) return;
    onPickGenreMix(genre, subs);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Blend className="size-4 text-primary" />
            Genre quick mix
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Load a blended feed from the top subreddits in a genre.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {GENRE_ORDER.map((genre) => {
            const count = getNsfwTopSubreddits({ category: genre }).length;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => pick(genre)}
                className="rounded-xl border border-border bg-background/50 px-3 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
              >
                <p className="text-sm font-medium">{NSFW_GENRE_LABELS[genre]}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{count} subs</p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
