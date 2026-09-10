"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { prompt: string };

export function PromptPreview({ prompt }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rise flex flex-col rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_24px_48px_-32px_rgb(30_27_75/0.25)] backdrop-blur sm:p-7 [animation-delay:140ms]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Your Claude Code Prompt</h2>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={copy} disabled={!prompt} aria-live="polite">
          {copied ? <Check data-icon="inline-start" className="text-emerald-600" /> : <Copy data-icon="inline-start" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <textarea
        readOnly
        aria-label="Generated prompt"
        value={prompt}
        placeholder="Your prompt will appear here..."
        className="min-h-[24rem] flex-1 resize-none rounded-2xl border border-border/70 bg-background/60 p-4 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/70 focus-visible:ring-3 focus-visible:ring-ring/50 lg:min-h-0"
      />
    </section>
  );
}
