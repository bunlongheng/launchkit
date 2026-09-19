import { aliasFor, NAME_MAX } from "@/lib/buildPrompt";
import { cn } from "@/lib/utils";
import { StepLabel } from "@/components/StepLabel";

type Props = {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  tabColor: string;
  onTabColorChange: (v: string) => void;
};

export function NameField({ value, onChange, invalid = false, tabColor, onTabColorChange }: Props) {
  const alias = value.trim() ? aliasFor(value) : null;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <StepLabel n={2} htmlFor="name">Name</StepLabel>
        <div className="flex min-w-0 items-center gap-2">
          {invalid && !alias && (
            <span className="text-xs font-medium text-destructive">Required</span>
          )}
          {/* The tab colour belongs to the alias, so it is picked right next to it.
              A native colour input is the only control that opens the OS picker,
              where the hex can be typed; the swatch pseudo-elements are what make
              it read as a plain circle. */}
          <input
            id="tab-color"
            type="color"
            value={tabColor}
            onChange={(e) => onTabColorChange(e.target.value)}
            title={`Tab colour ${tabColor.toUpperCase()}`}
            aria-label={`Tab colour, ${tabColor.toUpperCase()}`}
            className="size-6 shrink-0 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border [&::-moz-color-swatch]:border-black/10 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-black/10"
          />
          {alias && (
            // Shows the tab alias the prompt will tell the agent to create, so the
            // name and the alias never drift apart in the user's head.
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {alias}
            </span>
          )}
        </div>
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
        aria-describedby={invalid ? "generate-hint" : undefined}
        className={cn(
          "h-11 w-full rounded-2xl border bg-background/60 px-4 text-base outline-none placeholder:text-muted-foreground/70 focus-visible:ring-3",
          invalid
            ? "border-destructive focus-visible:ring-destructive/40"
            : "border-border/70 focus-visible:ring-ring/50",
        )}
      />
    </div>
  );
}
