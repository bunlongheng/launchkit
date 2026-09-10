import { useRef, type KeyboardEvent } from "react";
import { StepLabel } from "@/components/StepLabel";
import { STACK_LABELS, type Stack } from "@/lib/buildPrompt";
import { cn } from "@/lib/utils";

type Props = { value: Stack; onChange: (v: Stack) => void };

const STACKS = Object.keys(STACK_LABELS) as Stack[];

export function TechStackSelector({ value, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // A radiogroup is expected to move selection with the arrow keys, and only the
  // selected radio stays in the tab order (roving tabindex). Without this a keyboard
  // or screen reader user can focus an option but never change the choice.
  const move = (delta: number) => {
    const next = (STACKS.indexOf(value) + delta + STACKS.length) % STACKS.length;
    onChange(STACKS[next]);
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
      <div className="mb-3"><StepLabel n={3}>Tech stack</StepLabel></div>
      <div role="radiogroup" aria-label="Tech stack" className="grid grid-cols-3 gap-1 rounded-2xl border border-border/70 bg-background/60 p-1">
        {STACKS.map((s, i) => {
          const selected = s === value;
          return (
            <button
              key={s}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(s)}
              onKeyDown={onKeyDown}
              className={cn(
                "h-10 rounded-xl text-sm font-medium transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                selected ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
              )}
            >
              {STACK_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
