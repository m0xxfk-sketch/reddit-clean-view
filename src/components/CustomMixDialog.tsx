import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCustomMix, type CustomMix } from "@/lib/premium-store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (mix: CustomMix) => void;
};

export function CustomMixDialog({ open, onOpenChange, onSave }: Props) {
  const [name, setName] = useState("My mix");
  const [subsText, setSubsText] = useState("gonewild\nRealGirls\nnsfw");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const subs = subsText
      .split(/[\n,]+/)
      .map((s) => s.trim().replace(/^\/?r\//i, ""))
      .filter(Boolean)
      .slice(0, 10);
    if (!subs.length) return;
    const mix = saveCustomMix({ name: name.trim() || "My mix", subs });
    onSave(mix);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Custom mix</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="mix-name">Name</Label>
            <Input id="mix-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mix-subs">Subreddits (up to 10, one per line)</Label>
            <textarea
              id="mix-subs"
              value={subsText}
              onChange={(e) => setSubsText(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Save & load mix
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
