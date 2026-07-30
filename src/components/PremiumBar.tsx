import {
  Compass,
  Heart,
  Layers,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { CustomMixDialog } from "@/components/CustomMixDialog";
import { FavoritesPanel } from "@/components/FavoritesPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePremiumSettings } from "@/hooks/use-premium-settings";
import type { CustomMix } from "@/lib/premium-store";
import { playTick } from "@/lib/sounds";

type Props = {
  onDiscover: () => void;
  onCustomMix: (mix: CustomMix) => void;
  onShowFavorites: () => void;
  showingFavorites?: boolean;
};

export function PremiumBar({ onDiscover, onCustomMix, onShowFavorites, showingFavorites }: Props) {
  const { settings, update } = usePremiumSettings();
  const [mixOpen, setMixOpen] = useState(false);
  const [favOpen, setFavOpen] = useState(false);

  const tick = () => playTick(settings.sounds);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            onDiscover();
            tick();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-primary transition hover:bg-primary/20"
        >
          <Compass className="size-3.5" />
          Discover
        </button>

        <button
          type="button"
          onClick={() => {
            setMixOpen(true);
            tick();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
        >
          <Layers className="size-3.5" />
          Custom mix
        </button>

        <button
          type="button"
          onClick={() => {
            onShowFavorites();
            setFavOpen(true);
            tick();
          }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition ${
            showingFavorites
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="size-3.5" />
          Favorites
        </button>

        <Select
          value={settings.mediaFilter}
          onValueChange={(v) => update({ mediaFilter: v as typeof settings.mediaFilter })}
        >
          <SelectTrigger className="h-8 w-[108px] rounded-full border-border bg-surface text-xs">
            <SlidersHorizontal className="mr-1 size-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All media</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={settings.timeFilter}
          onValueChange={(v) => update({ timeFilter: v as typeof settings.timeFilter })}
        >
          <SelectTrigger className="h-8 w-[100px] rounded-full border-border bg-surface text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={String(settings.minScore)}
          onValueChange={(v) => update({ minScore: Number(v) })}
        >
          <SelectTrigger className="h-8 w-[108px] rounded-full border-border bg-surface text-xs">
            <Zap className="mr-1 size-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any score</SelectItem>
            <SelectItem value="50">50+ pts</SelectItem>
            <SelectItem value="100">100+ pts</SelectItem>
            <SelectItem value="500">500+ pts</SelectItem>
            <SelectItem value="1000">1000+ pts</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={settings.videoQuality}
          onValueChange={(v) => update({ videoQuality: v as typeof settings.videoQuality })}
        >
          <SelectTrigger className="h-8 w-[88px] rounded-full border-border bg-surface text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hd">HD</SelectItem>
            <SelectItem value="sd">SD</SelectItem>
          </SelectContent>
        </Select>

        <button
          type="button"
          aria-pressed={settings.immersive}
          onClick={() => {
            update({ immersive: !settings.immersive });
            tick();
          }}
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 transition ${
            settings.immersive
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="size-3.5" />
          Immersive
        </button>

        <button
          type="button"
          aria-pressed={settings.sounds}
          onClick={() => update({ sounds: !settings.sounds })}
          className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground"
          aria-label={settings.sounds ? "Mute sounds" : "Enable sounds"}
        >
          {settings.sounds ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
        </button>
      </div>

      <CustomMixDialog open={mixOpen} onOpenChange={setMixOpen} onSave={onCustomMix} />
      <FavoritesPanel open={favOpen} onOpenChange={setFavOpen} />
    </>
  );
}
