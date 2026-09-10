type Props = { n: number; htmlFor?: string; children: React.ReactNode };

export function StepLabel({ n, htmlFor, children }: Props) {
  const Tag = htmlFor ? "label" : "h2";
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
