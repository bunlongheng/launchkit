"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DescriptionField } from "@/components/DescriptionField";
import { FeatureToggles } from "@/components/FeatureToggles";
import { TechStackSelector } from "@/components/TechStackSelector";
import { PromptPreview } from "@/components/PromptPreview";
import { buildPrompt, DEFAULT_FEATURES, type Features, type Stack } from "@/lib/buildPrompt";

export function AppBuilder() {
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<Features>(DEFAULT_FEATURES);
  const [stack, setStack] = useState<Stack>("nextjs");
  const [prompt, setPrompt] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);

  const canGenerate = description.trim().length > 0;
  // buildPrompt is a pure string join, so recomputing it every render is cheaper
  // than tracking a snapshot of the inputs. It is only used to tell whether what
  // is on screen still matches the current settings.
  const isStale = prompt !== "" && prompt !== buildPrompt({ description, features, stack });

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
      <section className="rise rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_24px_48px_-32px_rgb(30_27_75/0.25)] backdrop-blur sm:p-7 [animation-delay:60ms]">
        <div className="grid gap-7 md:grid-cols-2">
          <div className="flex flex-col gap-7">
            <DescriptionField value={description} onChange={setDescription} />
            <TechStackSelector value={stack} onChange={setStack} />
          </div>
          <FeatureToggles value={features} onChange={setFeatures} />
        </div>
        <div className="mt-7">
          <Button
            size="lg"
            className="h-12 w-full rounded-2xl bg-linear-to-r from-primary to-violet-500 text-base font-semibold shadow-[0_12px_28px_-12px_var(--primary)] hover:from-primary/90 hover:to-violet-500/90"
            disabled={!canGenerate}
            onClick={() => setPrompt(buildPrompt({ description, features, stack }))}
          >
            <Sparkles data-icon="inline-start" />
            {prompt === "" ? "Generate Prompt" : "Regenerate Prompt"}
          </Button>
        </div>
      </section>

      {prompt !== "" && (
        <div ref={outputRef}>
          <PromptPreview prompt={prompt} stale={isStale} />
        </div>
      )}
    </div>
  );
}
