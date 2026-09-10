import type { ComponentType } from "react";
import { Globe, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { StepLabel } from "@/components/StepLabel";
import { GitHubMark, LocalAppsMark, VercelMark } from "@/components/BrandIcons";
import { skillFor, type Features } from "@/lib/buildPrompt";

type Props = { value: Features; onChange: (v: Features) => void };

type Toggle = {
  key: keyof Features;
  label: (on: boolean) => string;
  Icon: ComponentType<{ className?: string }>;
};

// Auth sits last: it is the one switch most apps leave off.
const TOGGLES: Toggle[] = [
  { key: "openSource", label: () => "Open Source", Icon: GitHubMark },
  { key: "deploy", label: () => "Deploy", Icon: VercelMark },
  { key: "isPublic", label: (on) => (on ? "Public" : "Private"), Icon: Globe },
  { key: "audit", label: () => "Audit", Icon: ShieldCheck },
  { key: "onboard", label: () => "Onboard Local App", Icon: LocalAppsMark },
  { key: "auth", label: () => "Auth", Icon: KeyRound },
];

export function FeatureToggles({ value, onChange }: Props) {
  return (
    <fieldset>
      <legend className="mb-3"><StepLabel n={3}>Features</StepLabel></legend>
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-background/60">
        {TOGGLES.map(({ key, label, Icon }) => {
          const on = value[key];
          const skill = skillFor(key);
          const RowIcon = key === "isPublic" && !on ? Lock : Icon;
          // The command is hidden from the accessible NAME, which must stay the plain
          // feature label, and reattached as a description. A describedby target still
          // announces even when it is aria-hidden.
          const skillId = skill ? `${key}-skill` : undefined;
          return (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors has-data-checked:bg-primary/[0.04]"
            >
              <RowIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{label(on)}</span>
                {skill && (
                  <span id={skillId} aria-hidden className="block truncate font-mono text-[11px] text-muted-foreground">
                    {skill}
                  </span>
                )}
              </span>
              <Switch checked={on} aria-describedby={skillId} onCheckedChange={(next) => onChange({ ...value, [key]: next })} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
