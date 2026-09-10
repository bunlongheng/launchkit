import { AppBuilder } from "@/components/AppBuilder";

export default function Home() {
  return (
    <main className="ground flex-1 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rise mb-8 flex items-center gap-4 sm:mb-10">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)]">
            <span className="font-mono text-lg font-semibold" aria-hidden>{">_"}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">LaunchKit</h1>
            <p className="text-sm text-muted-foreground sm:text-base">Turn your idea into a ready-to-use Claude Code prompt</p>
          </div>
        </header>
        <AppBuilder />
      </div>
    </main>
  );
}
