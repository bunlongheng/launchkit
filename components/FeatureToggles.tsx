import { Switch } from "@/components/ui/switch";
import { StepLabel } from "@/components/StepLabel";
import type { Features } from "@/lib/buildPrompt";

type Props = { value: Features; onChange: (v: Features) => void };

const TOGGLES: { key: keyof Features; label: (on: boolean) => string }[] = [
  { key: "openSource", label: () => "Open Source" },
  { key: "deploy", label: () => "Deploy" },
  { key: "isPublic", label: (on) => (on ? "Public" : "Private") },
  { key: "auth", label: () => "Auth" },
  { key: "audit", label: () => "Audit" },
  { key: "onboard", label: () => "Onboard Local App" },
];

export function FeatureToggles({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-3"><StepLabel n={2}>Features</StepLabel></legend>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {TOGGLES.map(({ key, label }) => {
          const on = value[key];
          return (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm font-medium transition-colors has-data-checked:border-primary/40 has-data-checked:bg-primary/5"
            >
              <span>{label(on)}</span>
              <Switch checked={on} onCheckedChange={(next) => onChange({ ...value, [key]: next })} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
