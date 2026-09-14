type Props = { n: number; htmlFor?: string; as?: "span"; children: React.ReactNode };

// A heading by default, a span when it sits inside the collapse button, where a
// heading would be the wrong thing to nest.
export function StepLabel({ n, htmlFor, as, children }: Props) {
  const Tag = htmlFor ? "label" : (as ?? "h2");
  return (
    <Tag htmlFor={htmlFor} className="flex items-center gap-3 text-base font-semibold">
      {/* Decorative step counter - hidden so the accessible name stays the question itself. */}
      <span aria-hidden className="grid size-7 place-items-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
        {n}
      </span>
      {children}
    </Tag>
  );
}
