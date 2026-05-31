/**
 * Thin wrapper over the Web Speech API so Aria can speak and listen.
 * Everything degrades gracefully when the browser doesn't support it.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/[*_`#>•]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export const speechSupported = (): boolean =>
  typeof window !== "undefined" && "speechSynthesis" in window;

export const recognitionSupported = (): boolean =>
  typeof window !== "undefined" &&
  ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

let preferredVoice: SpeechSynthesisVoice | null = null;

function chooseVoice(): SpeechSynthesisVoice | null {
  if (!speechSupported()) return null;
  if (preferredVoice) return preferredVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const ideal = [
    "Samantha",
    "Google UK English Female",
    "Microsoft Aria Online",
    "Karen",
    "Google US English",
  ];
  for (const name of ideal) {
    const v = voices.find((x) => x.name.includes(name));
    if (v) return (preferredVoice = v);
  }
  const en = voices.find((v) => v.lang.startsWith("en"));
  return (preferredVoice = en || voices[0]);
}

export function speak(
  text: string,
  opts: { onStart?: () => void; onEnd?: () => void } = {},
): void {
  if (!speechSupported()) {
    opts.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(stripMarkdown(text).slice(0, 600));
  const v = chooseVoice();
  if (v) u.voice = v;
  u.rate = 1.02;
  u.pitch = 1.0;
  u.onstart = () => opts.onStart?.();
  u.onend = () => opts.onEnd?.();
  u.onerror = () => opts.onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export interface Listener {
  stop: () => void;
}

export function listen(opts: {
  onResult: (text: string, final: boolean) => void;
  onEnd?: () => void;
  onError?: (e: string) => void;
}): Listener | null {
  if (!recognitionSupported()) {
    opts.onError?.("Speech recognition not supported in this browser.");
    return null;
  }
  const Ctor =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  rec.onresult = (event: any) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    if (final) opts.onResult(final.trim(), true);
    else if (interim) opts.onResult(interim.trim(), false);
  };
  rec.onerror = (e: any) => opts.onError?.(e.error || "recognition error");
  rec.onend = () => opts.onEnd?.();

  try {
    rec.start();
  } catch {
    /* already started */
  }
  return { stop: () => rec.stop() };
}

// Warm up the voice list (Chrome loads voices async).
if (speechSupported()) {
  window.speechSynthesis.onvoiceschanged = () => chooseVoice();
}
