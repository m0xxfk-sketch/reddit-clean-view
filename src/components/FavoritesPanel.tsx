import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getFavorites } from "@/lib/premium-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FavoritesPanel({ open, onOpenChange }: Props) {
  const [favorites, setFavorites] = useState(() => getFavorites());

  useEffect(() => {
    const sync = () => setFavorites(getFavorites());
    window.addEventListener("storage", sync);
    window.addEventListener("peek-favorites", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("peek-favorites", sync);
    };
  }, []);

  useEffect(() => {
    if (open) setFavorites(getFavorites());
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-border bg-surface">
        <SheetHeader>
          <SheetTitle className="font-display">Favorites</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto pr-2">
          {favorites.length === 0 && (
            <p className="text-sm text-muted-foreground">Tap the heart on any post to save it here.</p>
          )}
          {favorites.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-background/50 p-3">
              <p className="line-clamp-2 text-sm">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                u/{item.author} · r/{item.subreddit}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
