import { useRef, type ComponentType, type KeyboardEvent } from "react";
import { CollapsibleStep } from "@/components/CollapsibleStep";
import { ChromeMark, NextMark, RustMark, SwiftMark } from "@/components/BrandIcons";
import { APP_TYPES, appTypeFor, type AppType } from "@/lib/buildPrompt";
import { cn } from "@/lib/utils";

type Props = { value: AppType; onChange: (v: AppType) => void };

const MARKS: Record<AppType, ComponentType<{ className?: string }>> = {
  web: NextMark,
  chrome: ChromeMark,
  tui: RustMark,
  native: SwiftMark,
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

  const Selected = MARKS[value];

  return (
    <CollapsibleStep
      n={3}
      title="App type"
      summary={
        <span className="flex items-center gap-1.5">
          <Selected className="size-4 shrink-0 text-foreground" />
          {appTypeFor(value).label}
        </span>
      }
    >
      <div role="radiogroup" aria-label="App type" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "border-primary/40 bg-primary/[0.06]"
                  : "border-border/70 bg-background/60 hover:bg-primary/[0.03]",
              )}
            >
              {/* Brand marks keep their real colours in both states, so they stay recognisable. */}
              <Mark className="size-5 shrink-0 text-foreground" />
              <span className="min-w-0">
                <span className={cn("block text-sm font-medium", selected ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                <span className="block font-mono text-[11px] text-muted-foreground">{stack}</span>
              </span>
            </button>
          );
        })}
      </div>
    </CollapsibleStep>
  );
}
