import { StepLabel } from "@/components/StepLabel";
import { STACK_LABELS, type Stack } from "@/lib/buildPrompt";
import { cn } from "@/lib/utils";

type Props = { value: Stack; onChange: (v: Stack) => void };

const STACKS = Object.keys(STACK_LABELS) as Stack[];

export function TechStackSelector({ value, onChange }: Props) {
  return (
    <div>
      <div className="mb-3"><StepLabel n={3}>Tech stack</StepLabel></div>
      <div role="radiogroup" aria-label="Tech stack" className="grid grid-cols-3 gap-1 rounded-2xl border border-border/70 bg-background/60 p-1">
        {STACKS.map((s) => {
          const selected = s === value;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(s)}
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
