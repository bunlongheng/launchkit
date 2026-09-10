"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { prompt: string; stale?: boolean };

type CopyState = "idle" | "copied" | "failed";

export function PromptPreview({ prompt, stale = false }: Props) {
  const [status, setStatus] = useState<CopyState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "idle") return;
    const t = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
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
    <section className="rise flex flex-col rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_24px_48px_-32px_rgb(30_27_75/0.25)] backdrop-blur sm:p-7 [animation-delay:140ms]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-base font-semibold">Your Claude Code Prompt</h2>
          {stale && (
            <span role="status" className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
              Settings changed - regenerate
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={copy} disabled={!prompt}>
          {status === "copied" && <Check data-icon="inline-start" className="text-emerald-600" />}
          {status === "failed" && <TriangleAlert data-icon="inline-start" className="text-amber-600" />}
          {status === "idle" && <Copy data-icon="inline-start" />}
          {status === "copied" ? "Copied" : status === "failed" ? "Press Cmd C" : "Copy"}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {status === "copied" ? "Prompt copied to clipboard" : status === "failed" ? "Copying failed, the prompt is selected so you can copy it manually" : ""}
      </p>
      <textarea
        ref={textareaRef}
        readOnly
        aria-label="Generated prompt"
        value={prompt}
        placeholder="Your prompt will appear here..."
        className="min-h-[24rem] flex-1 resize-none rounded-2xl border border-border/70 bg-background/60 p-4 font-mono text-base leading-relaxed sm:text-[13px] outline-none placeholder:text-muted-foreground/70 focus-visible:ring-3 focus-visible:ring-ring/50 lg:min-h-0"
      />
    </section>
  );
}
