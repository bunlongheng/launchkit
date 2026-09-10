import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DESCRIPTION_MAX } from "@/lib/buildPrompt";
import { StepLabel } from "@/components/StepLabel";

type Props = { value: string; onChange: (v: string) => void };

export function DescriptionField({ value, onChange }: Props) {
  // A live region on the counter would announce on every keystroke. Only speak up
  // once the limit is close enough to matter.
  const remaining = DESCRIPTION_MAX - value.length;
  const nearLimit = remaining <= 100;
  const atLimit = remaining === 0;

  return (
    // Stretches to the height of the column beside it, so the box is as long as
    // the app type and features stack put together.
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <StepLabel n={1} htmlFor="description">What do you want to build?</StepLabel>
        <span
          className={cn("text-xs tabular-nums", atLimit ? "font-semibold text-amber-700" : "text-muted-foreground")}
          aria-live={nearLimit ? "polite" : "off"}
        >
          {atLimit ? `Limit reached, ${DESCRIPTION_MAX}` : `${value.length}/${DESCRIPTION_MAX}`}
        </span>
      </div>
      <Textarea
        id="description"
        value={value}
        maxLength={DESCRIPTION_MAX}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what you want to build..."
        className="min-h-36 flex-1 resize-none rounded-2xl bg-background/60 px-4 py-3 text-base leading-relaxed md:text-base"
      />
    </div>
  );
}
