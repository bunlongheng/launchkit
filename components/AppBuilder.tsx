"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DescriptionField } from "@/components/DescriptionField";
import { NameField } from "@/components/NameField";
import { FeatureToggles } from "@/components/FeatureToggles";
import { AppTypeSelector } from "@/components/AppTypeSelector";
import { PromptPreview } from "@/components/PromptPreview";
import { buildPrompt, buildSetupPrompt, DEFAULT_FEATURES, type AppType, type Features } from "@/lib/buildPrompt";

// A one-shot animation is a DOM concern, not React state: removing the class and
// forcing a reflow before re-adding it is what lets it replay on a second attempt.
function nudge(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus();
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
  el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
}

export function AppBuilder() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<Features>(DEFAULT_FEATURES);
  const [appType, setAppType] = useState<AppType>("web");
  const [prompt, setPrompt] = useState<{ setup: string; build: string } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);

  const generate = () => {
    if (!canGenerate) {
      setAttempts((n) => n + 1);
      // After the commit, otherwise the re-render that turns on the error border
      // rewrites className and wipes the class we just added.
      requestAnimationFrame(() => nudge(needsName ? "name" : "description"));
      return;
    }
    setPrompt({
      setup: buildSetupPrompt(name, features.isPublic),
      build: buildPrompt({ name, description, features, appType }),
    });
  };
  const revealed = useRef(false);

  const needsName = name.trim().length === 0;
  const needsDescription = description.trim().length === 0;
  const canGenerate = !needsName && !needsDescription;
  // A greyed-out button with no reason is a dead end, so say what is missing.
  const missing = needsName && needsDescription
    ? "Add a name and a description to generate"
    : needsName
      ? "Add a name to generate"
      : "Add a description to generate";
  // buildPrompt is a pure string join, so recomputing it every render is cheaper
  // than tracking a snapshot of the inputs. It is only used to tell whether what
  // is on screen still matches the current settings.
  const isStale = prompt !== null && prompt.build !== buildPrompt({ name, description, features, appType });

  // The output sits below the form, so bring it into view the first time it appears.
  // Regenerating afterwards leaves the scroll position alone.
  useEffect(() => {
    if (!prompt || revealed.current) return;
    revealed.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    outputRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [prompt]);

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="rise rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_24px_48px_-32px_rgb(30_27_75/0.25)] backdrop-blur sm:p-7 [animation-delay:60ms]">
        <div className="grid gap-7 md:grid-cols-2">
          <DescriptionField
            value={description}
            onChange={setDescription}
            invalid={attempts > 0 && needsDescription}
          />
          <div className="flex flex-col gap-7">
            <NameField
              value={name}
              onChange={setName}
              invalid={attempts > 0 && needsName}
              />
            <AppTypeSelector value={appType} onChange={setAppType} />
            <FeatureToggles value={features} onChange={setFeatures} />
          </div>
        </div>
        <div className="mt-7">
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-2xl bg-linear-to-r from-primary to-violet-500 text-base font-semibold shadow-[0_12px_28px_-12px_var(--primary)] hover:from-primary/90 hover:to-violet-500/90"
            // Genuinely enabled, never aria-disabled: the click does something useful
            // when the form is incomplete, and claiming disabled would be a lie to
            // assistive tech. The hint below is wired up as its description.
            aria-describedby={canGenerate ? undefined : "generate-hint"}

          >
            <Sparkles data-icon="inline-start" />
            {prompt === null ? "Generate Prompt" : "Regenerate Prompt"}
          </Button>
          {!canGenerate && (
            <p id="generate-hint" aria-live="polite" className="mt-2.5 text-center text-xs text-muted-foreground">
              {missing}
            </p>
          )}
        </div>
      </form>

      {prompt !== null && (
        <div ref={outputRef}>
          <PromptPreview setup={prompt.setup} build={prompt.build} stale={isStale} />
        </div>
      )}
    </div>
  );
}
