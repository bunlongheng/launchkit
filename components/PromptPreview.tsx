"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { setup: string; build: string; icon: string; stale?: boolean };

type CopyState = "idle" | "copied" | "failed";

type Step = { id: string; short: string; title: string; hint: string; copyLabel: string; text: string };

function PromptPanel({ step }: { step: Step }) {
  const [status, setStatus] = useState<CopyState>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow the box to its content so the whole prompt is readable without an inner
  // scrollbar. Writing style height is a DOM mutation, not React state.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [step.text]);

  useEffect(() => {
    if (status === "idle") return;
    const t = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(step.text);
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
    <div className="swap">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 text-xs text-muted-foreground">{step.hint}</p>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={copy} aria-label={step.copyLabel}>
          {status === "copied" && <Check data-icon="inline-start" className="text-emerald-600" />}
          {status === "failed" && <TriangleAlert data-icon="inline-start" className="text-amber-600" />}
          {status === "idle" && <Copy data-icon="inline-start" />}
          {status === "copied" ? "Copied" : status === "failed" ? "Copy manually" : "Copy"}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {status === "copied" ? `${step.title} copied to clipboard` : status === "failed" ? "Copying failed, the prompt is selected so you can copy it yourself" : ""}
      </p>
      <textarea
        ref={textareaRef}
        id={`${step.id}-prompt`}
        readOnly
        aria-label={step.title}
        value={step.text}
        className="min-h-44 w-full resize-none overflow-hidden rounded-2xl border border-border/70 bg-background/60 p-4 font-mono text-base leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-[13px]"
      />
    </div>
  );
}

export function PromptPreview({ setup, build, icon, stale = false }: Props) {
  const steps: Step[] = [
    {
      id: "setup",
      short: "Setup",
      title: "Run in this tab",
      hint: "Creates the repo and the tab alias, then stops.",
      copyLabel: "Copy the setup prompt",
      text: setup,
    },
    {
      id: "icon",
      short: "Icon",
      title: "Paste in the new tab",
      hint: "The house-style icon first, so the build already has one to keep.",
      copyLabel: "Copy the icon prompt",
      text: icon,
    },
    {
      id: "build",
      short: "Build",
      title: "Then build the app",
      hint: "Same tab, once the icon is in, so the build lands on that session.",
      copyLabel: "Copy the build prompt",
      text: build,
    },
  ];

  const [active, setActive] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move between tabs and take focus with them, which is what the tab
  // pattern asks for. Only the selected tab is reachable by Tab itself.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const next = e.key === "ArrowRight" ? active + 1 : e.key === "ArrowLeft" ? active - 1 : e.key === "Home" ? 0 : e.key === "End" ? steps.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const i = (next + steps.length) % steps.length;
    setActive(i);
    tabsRef.current[i]?.focus();
  };

  const step = steps[active];

  return (
    <section className="rise flex flex-col gap-5 rounded-3xl border border-border/70 bg-white/80 p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_24px_48px_-32px_rgb(30_27_75/0.25)] backdrop-blur sm:p-7">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-base font-semibold">Your Claude Code Prompt</h2>
        {stale && (
          <span role="status" className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
            Settings changed - regenerate
          </span>
        )}
      </div>

      <div role="tablist" aria-label="Prompt steps" onKeyDown={onKeyDown} className="flex gap-1.5">
        {steps.map((s, i) => {
          const selected = i === active;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${s.id}-tab`}
              aria-selected={selected}
              aria-controls={`${s.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={`chev flex flex-1 items-center gap-2 py-2.5 pr-4 text-left first:rounded-l-2xl transition-colors focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] sm:gap-2.5 sm:py-3 ${
                selected
                  ? "bg-linear-to-r from-primary to-violet-500 text-white"
                  : "bg-primary/[0.07] text-foreground/70 hover:bg-primary/[0.13]"
              }`}
            >
              <span
                aria-hidden
                className={`grid size-6 shrink-0 place-items-center rounded-full font-mono text-xs font-bold sm:size-7 ${
                  selected ? "bg-white/25 text-white" : "bg-primary/10 text-primary"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold sm:text-sm">{s.short}</span>
                <span className={`hidden text-[11px] sm:block ${selected ? "text-white/75" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`${step.id}-panel`} aria-labelledby={`${step.id}-tab`} tabIndex={0} className="outline-none">
        <PromptPanel key={step.id} step={step} />
      </div>
    </section>
  );
}
