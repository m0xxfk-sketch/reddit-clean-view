import { Keyboard } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SHORTCUTS = [
  { keys: ["↓", "j"], desc: "Next post (feed mode)" },
  { keys: ["↑", "k"], desc: "Previous post (feed mode)" },
  { keys: ["?"], desc: "Show shortcuts" },
  { keys: ["Esc"], desc: "Close viewer / dialogs" },
  { keys: ["←", "→"], desc: "Navigate in focus viewer" },
  { keys: ["Space"], desc: "Slideshow in focus viewer" },
  { keys: ["F"], desc: "Toggle fit/fill in focus viewer" },
  { keys: ["Scroll"], desc: "Auto-load more posts near bottom" },
];

export function ShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Keyboard className="size-4 text-primary" />
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <ul className="mt-2 space-y-2">
          {SHORTCUTS.map(({ keys, desc }) => (
            <li key={desc} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{desc}</span>
              <span className="flex shrink-0 gap-1">
                {keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
