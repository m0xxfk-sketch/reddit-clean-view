import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getNsfwSubredditsByGenre, type NsfwGenreGroup } from "@/lib/nsfw-subreddits";

const MIX_VALUE = "__mix__";
const groups = getNsfwSubredditsByGenre();

type Props = {
  value: string;
  onPickSub: (name: string) => void;
  onPickMix: () => void;
};

export function NsfwGenreSelect({ value, onPickSub, onPickMix }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterGroups(groups, query), [query]);

  return (
    <Select
      value={value || undefined}
      onValueChange={(next) => {
        if (next === MIX_VALUE) onPickMix();
        else onPickSub(next);
      }}
    >
      <SelectTrigger
        aria-label="Browse NSFW subreddits by genre"
        className="h-9 w-[min(100%,260px)] rounded-full border-border bg-surface text-xs shadow-none focus:ring-primary/20"
      >
        <SelectValue placeholder="NSFW genres…" />
      </SelectTrigger>
      <SelectContent className="max-h-[min(70vh,420px)] w-[min(100vw-2rem,320px)]">
        <div className="sticky top-0 z-10 border-b border-border bg-popover px-2 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subreddits…"
              aria-label="Search NSFW subreddits"
              className="h-8 w-full rounded-md border border-input bg-surface pl-8 pr-2 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/50"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <SelectItem value={MIX_VALUE} className="text-xs font-medium">
          Mix top 6
        </SelectItem>
        <SelectSeparator />
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">No matches.</p>
        )}
        {filtered.map((group, i) => (
          <SelectGroup key={group.genre}>
            {i > 0 && <SelectSeparator />}
            <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {group.label}
            </SelectLabel>
            {group.subs.map((sub) => (
              <SelectItem key={sub.name} value={sub.name} className="text-xs">
                r/{sub.name} · {sub.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function filterGroups(groups: NsfwGenreGroup[], query: string): NsfwGenreGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      subs: g.subs.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.label.toLowerCase().includes(q) ||
          g.label.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.subs.length > 0);
}

export { MIX_VALUE as NSFW_MIX_VALUE };
