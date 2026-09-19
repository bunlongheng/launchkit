"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DescriptionField } from "@/components/DescriptionField";
import { NameField } from "@/components/NameField";
import { FeatureToggles } from "@/components/FeatureToggles";
import { AppTypeSelector } from "@/components/AppTypeSelector";
import { PromptPreview } from "@/components/PromptPreview";
import { RecentApps } from "@/components/RecentApps";
import { buildIconPrompt, buildPrompt, buildSetupPrompt, DEFAULT_FEATURES, DEFAULT_TAB_COLOR, type AppType, type Features, type PromptInput } from "@/lib/buildPrompt";
import { addToHistory, useHistory, writeHistory, type HistoryEntry } from "@/lib/history";

type Prompts = { setup: string; build: string; icon: string };

// The 3 prompts are a pure function of the form, which is what lets a recent app be
// put back exactly as it was without having been stored alongside it.
const promptsFor = ({ name, description, features, appType, tabColor }: PromptInput & { tabColor: string }): Prompts => ({
  setup: buildSetupPrompt(name, features.isPublic, tabColor),
  build: buildPrompt({ name, description, features, appType }),
  icon: buildIconPrompt({ name, description, appType }),
});

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
  const [tabColor, setTabColor] = useState(DEFAULT_TAB_COLOR);
  // The last 10 generated apps, kept in localStorage rather than in state so a
  // reload, and a second tab, both see the same list.
  const history = useHistory();
  const [prompt, setPrompt] = useState<Prompts | null>(null);
  const [attempts, setAttempts] = useState(0);
  // Bumped on every Generate click so the mic stops listening, whether the form was
  // complete or not.
  const [micStop, setMicStop] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);

  const generate = () => {
    setMicStop((n) => n + 1);
    if (!canGenerate) {
      setAttempts((n) => n + 1);
      // After the commit, otherwise the re-render that turns on the error border
      // rewrites className and wipes the class we just added.
      requestAnimationFrame(() => nudge(needsName ? "name" : "description"));
      return;
    }
    setPrompt(promptsFor({ name, description, features, appType, tabColor }));
    writeHistory(addToHistory(history, { name: name.trim(), description: description.trim(), features, appType, tabColor, at: Date.now() }));
  };

  // Picking a recent app puts it back exactly as it was left: every setting, and the
  // 3 prompts it had already produced. Nothing to regenerate, nothing to re-answer.
  const restore = (entry: HistoryEntry) => {
    setName(entry.name);
    setDescription(entry.description);
    setFeatures(entry.features);
    setAppType(entry.appType);
    setTabColor(entry.tabColor);
    setPrompt(promptsFor(entry));
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
  const current = promptsFor({ name, description, features, appType, tabColor });
  const isStale = prompt !== null && (prompt.build !== current.build || prompt.setup !== current.setup);

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
      <RecentApps entries={history} onPick={restore} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
        className="rise rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_24px_48px_-32px_rgb(30_27_75/0.25)] backdrop-blur sm:p-6 [animation-delay:60ms]">
        {/* 60/40 rather than an even split: the description is the part you actually
            write in, the 3 pickers on the right are all fixed height. */}
        <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
          <DescriptionField
            value={description}
            onChange={setDescription}
            invalid={attempts > 0 && needsDescription}
            stopSignal={micStop}
          />
          <div className="flex flex-col gap-6">
            <NameField
              value={name}
              onChange={setName}
              invalid={attempts > 0 && needsName}
              tabColor={tabColor}
              onTabColorChange={setTabColor}
            />
            <AppTypeSelector value={appType} onChange={setAppType} />
            <FeatureToggles value={features} onChange={setFeatures} />
          </div>
        </div>
        <div className="mt-5">
          <Button
            type="submit"
            size="lg"
            className="h-11 w-full rounded-2xl bg-linear-to-r from-primary to-violet-500 text-base font-semibold shadow-[0_12px_28px_-12px_var(--primary)] hover:from-primary/90 hover:to-violet-500/90"
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
          <PromptPreview setup={prompt.setup} build={prompt.build} icon={prompt.icon} stale={isStale} />
        </div>
      )}
    </div>
  );
}
