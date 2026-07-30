import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getFavorites } from "@/lib/premium-store";
import { useSyncExternalStore } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function FavoritesPanel({ open, onOpenChange }: Props) {
  const favorites = useSyncExternalStore(subscribe, () => getFavorites(), () => []);

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
