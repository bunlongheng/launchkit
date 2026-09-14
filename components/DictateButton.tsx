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

type Props = { value: string; onChange: (v: string) => void; max: number };

export function DictateButton({ value, onChange, max }: Props) {
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

  useEffect(() => () => {
    wanted.current = false;
    recognition.current?.stop();
  }, []);

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

    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) settled.current += text;
        else interim += text;
      }
      const spoken = `${settled.current}${interim}`.trim();
      const joined = base.current ? `${base.current} ${spoken}` : spoken;
      onChange(joined.slice(0, max));
    };
    r.onerror = (e) => {
      // A pause in the talking is not a fault: the browser reports no-speech, ends
      // the session, and onend starts the next one. Only a real refusal stops us.
      if (e.error === "no-speech" || e.error === "aborted") return;
      wanted.current = false;
      setError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Microphone blocked. Allow it in the browser to talk."
        : "Could not hear that. Try again.");
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
    <>
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        aria-label={listening ? "Stop talking" : "Talk instead of typing"}
        className={`absolute right-3 bottom-3 grid size-12 place-items-center rounded-full shadow-[0_8px_20px_-8px_rgb(30_27_75/0.45)] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
          listening
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-linear-to-r from-primary to-violet-500 text-white hover:opacity-90"
        }`}
      >
        {listening && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />}
        {listening ? <Square className="size-4 fill-current" /> : <Mic className="size-5" />}
      </button>
      <p aria-live="polite" className="absolute right-17 bottom-5 text-xs font-medium text-muted-foreground">
        {listening ? "Listening..." : error}
      </p>
    </>
  );
}
