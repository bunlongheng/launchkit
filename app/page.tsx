import Image from "next/image";
import icon from "./icon.png";
import { AppBuilder } from "@/components/AppBuilder";

export default function Home() {
  return (
    <main className="ground flex-1 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Deliberately not animated in: if every element starts at opacity 0 the first
            frame paints nothing, and the browser never reports FCP or LCP. */}
        <header className="mb-8 flex items-center gap-4 sm:mb-10">
          <Image
            src={icon}
            alt=""
            width={52}
            height={52}
            priority
            className="size-12 shrink-0 drop-shadow-[0_8px_20px_rgb(88_28_235/0.35)] sm:size-14"
          />
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
