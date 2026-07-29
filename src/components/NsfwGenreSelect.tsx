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
import { getNsfwSubredditsByGenre } from "@/lib/nsfw-subreddits";

const MIX_VALUE = "__mix__";
const groups = getNsfwSubredditsByGenre();

type Props = {
  value: string;
  onPickSub: (name: string) => void;
  onPickMix: () => void;
};

export function NsfwGenreSelect({ value, onPickSub, onPickMix }: Props) {
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
        className="h-9 w-[min(100%,240px)] rounded-full border-border bg-surface text-xs shadow-none focus:ring-primary/20"
      >
        <SelectValue placeholder="NSFW genres…" />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectItem value={MIX_VALUE} className="text-xs font-medium">
          Mix top 6
        </SelectItem>
        <SelectSeparator />
        {groups.map((group, i) => (
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

export { MIX_VALUE as NSFW_MIX_VALUE };
