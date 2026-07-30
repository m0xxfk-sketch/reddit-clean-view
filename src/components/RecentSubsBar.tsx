import { useEffect, useState } from "react";

import { getRecentSubs } from "@/lib/premium-store";

type Props = {
  current?: string;
  onPick: (sub: string) => void;
};

export function RecentSubsBar({ current, onPick }: Props) {
  const [recent, setRecent] = useState(() => getRecentSubs(8));

  useEffect(() => {
    const sync = () => setRecent(getRecentSubs(8));
    window.addEventListener("storage", sync);
    window.addEventListener("peek-settings", sync);
    window.addEventListener("peek-history", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("peek-settings", sync);
      window.removeEventListener("peek-history", sync);
    };
  }, []);

  const subs = recent.filter((sub) => sub.toLowerCase() !== current?.toLowerCase());
  if (!subs.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-muted-foreground">Recent</span>
      {subs.map((sub) => (
        <button
          key={sub}
          type="button"
          onClick={() => onPick(sub)}
          className="rounded-full border border-border bg-background/60 px-3 py-1 transition hover:border-primary/40 hover:text-primary"
        >
          r/{sub}
        </button>
      ))}
    </div>
  );
}
