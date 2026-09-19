"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  // Whether the person still wants to be heard. Nothing else is allowed to end the
  // dictation: the browser closes a session after a pause, on a dropped network, or
  // for no stated reason at all, and every one of those starts the next session.
  const wanted = useRef(false);
  // What was already typed when the mic started, plus whatever has been finalised
  // since. Interim words are re-sent on every event, so they cannot be appended.
  const base = useRef("");
  const settled = useRef("");
  // A session that is believed to be running, and when it was started. Together they
  // are what the watchdog reads to tell a live mic from a dead one.
  const running = useRef(false);
  const startedAt = useRef(0);
  const shortRuns = useRef(0);

  // The session that should be opened next. Held in a ref so a session can start its
  // own successor without depending on itself.
  const latest = useRef<() => void>(() => {});

  // One recognition session, which is a disposable thing: it is started, it ends on
  // its own, and onend opens the next one. Reusing the object across sessions is what
  // used to leave the mic silently off, so each one is built fresh.
  const session = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor || !wanted.current) return;

    const r = new Ctor();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;

    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) settled.current += text;
        else interim += text;
      }
      shortRuns.current = 0;
      const spoken = `${settled.current}${interim}`.trim();
      const joined = base.current ? `${base.current} ${spoken}` : spoken;
      onChange(joined.slice(0, max));
    };

    r.onerror = (e) => {
      // A refused microphone is the only thing that cannot be recovered from, since
      // there is nothing to listen to. Everything else - no-speech, aborted, network,
      // audio-capture - just ends the session, and onend opens the next one.
      if (e.error !== "not-allowed" && e.error !== "service-not-allowed") return;
      wanted.current = false;
      running.current = false;
      setError("Microphone blocked. Allow it in the browser to talk.");
      setListening(false);
    };

    r.onend = () => {
      running.current = false;
      // Anything settled belongs to the finished session; the next one starts its
      // result list over, so fold it into the base before restarting.
      base.current = `${base.current ? `${base.current} ` : ""}${settled.current}`.trim();
      settled.current = "";
      if (!wanted.current) {
        setListening(false);
        return;
      }
      // Sessions that die the instant they start would otherwise spin the engine, so
      // after a few in a row the next one waits a beat. It still never gives up.
      shortRuns.current = Date.now() - startedAt.current < 400 ? shortRuns.current + 1 : 0;
      if (shortRuns.current >= 3) setTimeout(() => latest.current(), 600);
      else latest.current();
    };

    recognition.current = r;
    startedAt.current = Date.now();
    try {
      r.start();
      running.current = true;
    } catch {
      // start() throws while the previous session is still tearing down. Leaving
      // running false is the signal for the watchdog to try again.
      running.current = false;
    }
  }, [max, onChange]);

  // The watchdog. A session can go quiet without ever calling onend - a backgrounded
  // tab, a start() that threw - and the button would still say Listening while nothing
  // was being heard. This is what makes "on until you stop it" true.
  useEffect(() => {
    latest.current = session;
  }, [session]);
  useEffect(() => {
    const id = setInterval(() => {
      if (!wanted.current || running.current) return;
      if (Date.now() - startedAt.current < 1500) return;
      latest.current();
    }, 1500);
    return () => clearInterval(id);
  }, []);

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
    if (!recognitionCtor()) return;
    base.current = value.trim();
    settled.current = "";
    shortRuns.current = 0;
    wanted.current = true;
    setError("");
    setListening(true);
    session();
  };

  if (!supported) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        aria-label={listening ? "Stop talking" : "Talk instead of typing"}
        className={`relative flex h-11 items-center gap-2.5 rounded-2xl px-5 text-base font-semibold text-white shadow-[0_10px_24px_-12px_rgb(30_27_75/0.6)] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
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
