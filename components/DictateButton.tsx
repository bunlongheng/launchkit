"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square } from "lucide-react";

// The Web Speech API has no TypeScript lib definition and is still prefixed in
// Safari, so this is the minimum surface actually used here.
type SpeechResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const recognitionCtor = () => {
  if (typeof window === "undefined") return undefined;
  const w = window as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

type Props = { value: string; onChange: (v: string) => void; max: number; stopSignal?: number };

export function DictateButton({ value, onChange, max, stopSignal = 0 }: Props) {
  // Firefox has no speech recognition at all, so the button is not rendered there
  // rather than offered and then failing. The server has no window to ask, hence the
  // false server snapshot: the button appears on hydration, never before.
  const supported = useSyncExternalStore(
    () => () => {},
    () => recognitionCtor() !== undefined,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  // Whether the person still wants to be heard. The browser ends a session on its
  // own after a pause, which is what made the mic stop mid-sentence, so every end
  // that was not asked for starts a new session.
  const wanted = useRef(false);
  // What was already typed when the mic started, plus whatever has been finalised
  // since. Interim words are re-sent on every event, so they cannot be appended.
  const base = useRef("");
  const settled = useRef("");
  const retries = useRef(0);

  useEffect(() => () => {
    wanted.current = false;
    recognition.current?.stop();
  }, []);

  // Generating means the description is finished, so the mic must not keep writing
  // into it behind the prompt. The signal only counts once it changes, or the first
  // render would read as a stop.
  const stopped = useRef(stopSignal);
  useEffect(() => {
    if (stopSignal === stopped.current) return;
    stopped.current = stopSignal;
    wanted.current = false;
    recognition.current?.stop();
    setListening(false);
  }, [stopSignal]);

  const stop = () => {
    wanted.current = false;
    recognition.current?.stop();
    setListening(false);
  };

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    const r = new Ctor();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;

    base.current = value.trim();
    settled.current = "";
    retries.current = 0;

    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) settled.current += text;
        else interim += text;
      }
      retries.current = 0;
      const spoken = `${settled.current}${interim}`.trim();
      const joined = base.current ? `${base.current} ${spoken}` : spoken;
      onChange(joined.slice(0, max));
    };
    r.onerror = (e) => {
      // A pause in the talking is not a fault: the browser reports no-speech, ends
      // the session, and onend starts the next one.
      if (e.error === "no-speech" || e.error === "aborted") return;
      // The speech service drops a session now and then. Ride out a couple of those
      // before giving up, or the mic goes quiet for no reason the user can see.
      if (e.error === "network" && retries.current < 3) {
        retries.current += 1;
        return;
      }
      wanted.current = false;
      setError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Microphone blocked. Allow it in the browser to talk."
        : "The browser stopped listening. Tap to carry on.");
      setListening(false);
    };
    r.onend = () => {
      if (!wanted.current) {
        setListening(false);
        return;
      }
      // Anything settled belongs to the finished session; the next one starts its
      // result list over, so fold it into the base before restarting.
      base.current = `${base.current ? `${base.current} ` : ""}${settled.current}`.trim();
      settled.current = "";
      try {
        r.start();
      } catch {
        // start() throws if the engine has not finished tearing the session down.
        // One retry on the next tick is enough; give up quietly after that.
        setTimeout(() => {
          if (!wanted.current) return;
          try {
            r.start();
          } catch {
            setListening(false);
          }
        }, 250);
      }
    };

    recognition.current = r;
    wanted.current = true;
    setError("");
    setListening(true);
    r.start();
  };

  if (!supported) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        aria-label={listening ? "Stop talking" : "Talk instead of typing"}
        className={`relative flex h-12 items-center gap-2.5 rounded-2xl px-5 text-base font-semibold text-white shadow-[0_10px_24px_-12px_rgb(30_27_75/0.6)] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
          listening ? "bg-red-500 hover:bg-red-600" : "bg-linear-to-r from-primary to-violet-500 hover:opacity-90"
        }`}
      >
        {listening ? <Square className="size-4 fill-current" /> : <Mic className="size-5" />}
        {listening ? "Stop" : "Talk"}
      </button>
      {listening && (
        <span aria-hidden className="flex items-center gap-1.5">
          <span className="size-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-600">Listening</span>
        </span>
      )}
      {/* The sentence wraps to 5 lines beside the button on a phone, so it is kept
          for screen readers there and only shown once there is room for it. */}
      <p aria-live="polite" className="sr-only min-w-0 flex-1 text-sm text-muted-foreground sm:not-sr-only">
        {listening ? "Say what you want to build. It keeps listening until you tap Stop." : error || "Tap Talk and say it out loud."}
      </p>
    </div>
  );
}
