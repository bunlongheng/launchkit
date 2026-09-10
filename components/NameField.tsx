import { aliasFor, NAME_MAX } from "@/lib/buildPrompt";
import { cn } from "@/lib/utils";
import { StepLabel } from "@/components/StepLabel";

type Props = { value: string; onChange: (v: string) => void; invalid?: boolean };

export function NameField({ value, onChange, invalid = false }: Props) {
  const alias = value.trim() ? aliasFor(value) : null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <StepLabel n={2} htmlFor="name">Name your app</StepLabel>
        {invalid && !alias && (
          <span className="text-xs font-medium text-destructive">Required</span>
        )}
        {alias && (
          // Shows the tab alias the prompt will tell the agent to create, so the
          // name and the alias never drift apart in the user's head.
          <span className="truncate font-mono text-[11px] text-muted-foreground" aria-live="polite">
            {alias}
          </span>
        )}
      </div>
      <input
        id="name"
        type="text"
        value={value}
        maxLength={NAME_MAX}
        onChange={(e) => onChange(e.target.value)}
        placeholder="LaunchKit"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-12 w-full rounded-2xl border bg-background/60 px-4 text-base outline-none placeholder:text-muted-foreground/70 focus-visible:ring-3",
          invalid
            ? "border-destructive focus-visible:ring-destructive/40"
            : "border-border/70 focus-visible:ring-ring/50",
        )}
      />
    </div>
  );
}
