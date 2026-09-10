"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { setup: string; build: string; stale?: boolean };

type CopyState = "idle" | "copied" | "failed";

function PromptBlock({ id, step, title, hint, copyLabel, text, rows }: {
  id: string;
  step: number;
  title: string;
  hint: string;
  copyLabel: string;
  text: string;
  rows: string;
}) {
  const [status, setStatus] = useState<CopyState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "idle") return;
    const t = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      // The clipboard API is unavailable on insecure origins and can be denied
      // outright. Select the text so it can still be copied by hand rather than
      // letting the click do nothing at all.
      textareaRef.current?.select();
      setStatus("failed");
    }
  };

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
            {step}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{title}</span>
            <span className="block text-xs text-muted-foreground">{hint}</span>
          </span>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={copy} aria-label={copyLabel}>
          {status === "copied" && <Check data-icon="inline-start" className="text-emerald-600" />}
          {status === "failed" && <TriangleAlert data-icon="inline-start" className="text-amber-600" />}
          {status === "idle" && <Copy data-icon="inline-start" />}
          {status === "copied" ? "Copied" : status === "failed" ? "Copy manually" : "Copy"}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {status === "copied" ? `${title} copied to clipboard` : status === "failed" ? "Copying failed, the prompt is selected so you can copy it yourself" : ""}
      </p>
      <textarea
        ref={textareaRef}
        id={id}
        readOnly
        aria-label={title}
        value={text}
        className={`${rows} w-full resize-none rounded-2xl border border-border/70 bg-background/60 p-4 font-mono text-base leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-[13px]`}
      />
    </div>
  );
}

export function PromptPreview({ setup, build, stale = false }: Props) {
  return (
    <section className="rise flex flex-col gap-6 rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_24px_48px_-32px_rgb(30_27_75/0.25)] backdrop-blur sm:p-7">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-base font-semibold">Your Claude Code Prompt</h2>
        {stale && (
          <span role="status" className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
            Settings changed - regenerate
          </span>
        )}
      </div>

      <PromptBlock
        id="setup-prompt"
        step={1}
        title="Run in this tab"
        hint="Creates the repo and the tab alias, then stops."
        copyLabel="Copy the setup prompt"
        text={setup}
        rows="min-h-44"
      />
      <PromptBlock
        id="build-prompt"
        step={2}
        title="Paste in the new tab"
        hint="The build itself, so its token usage lands on that session."
        copyLabel="Copy the build prompt"
        text={build}
        rows="min-h-[26rem]"
      />
    </section>
  );
}
