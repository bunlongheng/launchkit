"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { StepLabel } from "@/components/StepLabel";

type Props = { n: number; title: string; summary: React.ReactNode; children: React.ReactNode };

// On a phone the app type and feature lists push the Generate button 2 screens down,
// so they start folded with their current answer shown on the header. From md up
// there is room for both at once and the toggle is not rendered at all.
export function CollapsibleStep({ n, title, summary, children }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
      >
        <StepLabel n={n} as="span">{title}</StepLabel>
        <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
          {!open && summary}
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div className="mb-3 hidden md:block">
        <StepLabel n={n}>{title}</StepLabel>
      </div>
      <div id={id} className={open ? undefined : "hidden md:block"}>
        {children}
      </div>
    </div>
  );
}
