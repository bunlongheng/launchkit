import { slugify } from "@/lib/buildPrompt";
import type { HistoryEntry } from "@/lib/history";

type Props = { entries: HistoryEntry[]; onPick: (entry: HistoryEntry) => void };

export function RecentApps({ entries, onPick }: Props) {
  if (entries.length === 0) return null;

  return (
    <section aria-label="Recent apps" className="rise">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Recent</h2>
        {entries.map((entry) => (
          <button
            key={slugify(entry.name)}
            type="button"
            onClick={() => onPick(entry)}
            className="flex max-w-56 items-center gap-2 rounded-full border border-border/70 bg-white/70 px-3 py-1.5 text-sm transition-colors outline-none hover:bg-primary/[0.06] focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {/* The dot is the tab colour that was picked with it, so a name you have
                forgotten is still recognisable by its colour. */}
            <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.tabColor }} />
            <span className="truncate">{entry.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
