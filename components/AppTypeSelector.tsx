import { useRef, type ComponentType, type KeyboardEvent } from "react";
import { SquareTerminal } from "lucide-react";
import { StepLabel } from "@/components/StepLabel";
import { AppleMark, ChromeMark, NextMark } from "@/components/BrandIcons";
import { APP_TYPES, type AppType } from "@/lib/buildPrompt";
import { cn } from "@/lib/utils";

type Props = { value: AppType; onChange: (v: AppType) => void };

const MARKS: Record<AppType, ComponentType<{ className?: string }>> = {
  web: NextMark,
  chrome: ChromeMark,
  tui: SquareTerminal,
  native: AppleMark,
};

export function AppTypeSelector({ value, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // A radiogroup is expected to move selection with the arrow keys, and only the
  // selected radio stays in the tab order (roving tabindex). Without this a keyboard
  // or screen reader user can focus an option and never change the choice.
  const move = (delta: number) => {
    const index = APP_TYPES.findIndex((a) => a.key === value);
    const next = (index + delta + APP_TYPES.length) % APP_TYPES.length;
    onChange(APP_TYPES[next].key);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    }
  };

  return (
    <div>
      <div className="mb-3"><StepLabel n={2}>App type</StepLabel></div>
      <div role="radiogroup" aria-label="App type" className="grid grid-cols-2 gap-2">
        {APP_TYPES.map(({ key, label, stack }, i) => {
          const selected = key === value;
          const Mark = MARKS[key];
          return (
            <button
              key={key}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(key)}
              onKeyDown={onKeyDown}
              // The Next.js mark punches its highlights out in the surface colour,
              // so it stays legible on both the selected and unselected background.
              style={{ "--nextjs-ink": selected ? "var(--primary)" : "var(--background)" } as React.CSSProperties}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "border-primary/40 bg-primary/[0.06]"
                  : "border-border/70 bg-background/60 hover:bg-primary/[0.03]",
              )}
            >
              <Mark className={cn("size-5 shrink-0", selected ? "text-foreground" : "text-muted-foreground")} />
              <span className="min-w-0">
                <span className={cn("block truncate text-sm font-medium", selected ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                <span className="block truncate font-mono text-[11px] text-muted-foreground">{stack}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
