"use client";

import { useRef, useState } from "react";
import { useAria } from "@/store/useAria";
import { runCode, type ExecResult } from "@/lib/runtime/exec";
import Icon from "@/components/ui/Icon";

type Lang = "python" | "javascript";

const EXAMPLES: Record<Lang, string> = {
  python: `# Real Python, running in your browser via WASM
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print("First 10 Fibonacci numbers:")
print([fib(i) for i in range(10)])

import statistics
data = [4, 8, 15, 16, 23, 42]
print(f"mean = {statistics.mean(data)}")
print(f"stdev = {statistics.stdev(data):.3f}")
`,
  javascript: `// Real JavaScript, sandboxed in a Web Worker
const data = [4, 8, 15, 16, 23, 42];

console.log("sum:", data.reduce((a, b) => a + b, 0));
console.log("sorted desc:", [...data].sort((a, b) => b - a));

// the returned value is printed too
return data.map((x) => x * x);
`,
};

export default function Code() {
  const [lang, setLang] = useState<Lang>("python");
  const [code, setCode] = useState(EXAMPLES.python);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<ExecResult | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const addNote = useAria((s) => s.addNote);

  const run = async () => {
    setRunning(true);
    setResult(null);
    setStatus("Starting…");
    const res = await runCode(lang, code, setStatus);
    setResult(res);
    setStatus("");
    setRunning(false);
  };

  const switchLang = (l: Lang) => {
    setLang(l);
    if (code.trim() === EXAMPLES.python.trim() || code.trim() === EXAMPLES.javascript.trim() || !code.trim())
      setCode(EXAMPLES[l]);
    setResult(null);
  };

  return (
    <div className="flex h-full flex-col bg-bg1/40">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <div className="flex gap-0.5 rounded-lg bg-white/5 p-0.5">
          {(["python", "javascript"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              className={`rounded-md px-2.5 py-1 text-[12px] capitalize ${
                lang === l ? "bg-accent text-white" : "text-text2 hover:text-text0"
              }`}
            >
              {l === "javascript" ? "JavaScript" : "Python"}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() =>
            addNote(lang === "python" ? "script.py" : "script.js", code)
          }
          className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-text1 hover:bg-white/5"
          title="Save to Files"
        >
          <Icon name="Save" size={13} /> Save
        </button>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-1.5 rounded-lg accent-grad px-3.5 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
        >
          {running ? (
            <Icon name="Loader" size={13} className="animate-spin-slow" />
          ) : (
            <Icon name="Play" size={13} />
          )}
          {running ? "Running" : "Run"}
        </button>
      </div>

      {/* editor */}
      <div className="relative min-h-0 flex-1">
        <textarea
          ref={taRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              const ta = e.currentTarget;
              const s = ta.selectionStart;
              const v = ta.value;
              setCode(v.slice(0, s) + "    " + v.slice(ta.selectionEnd));
              requestAnimationFrame(() => {
                ta.selectionStart = ta.selectionEnd = s + 4;
              });
            }
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
          }}
          spellCheck={false}
          className="h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-text0 outline-none scroll-thin"
          style={{ tabSize: 4 }}
        />
        <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-text3">
          ⌘↵ to run
        </div>
      </div>

      {/* output console */}
      <div className="flex h-[40%] min-h-[120px] flex-col border-t border-line bg-black/40">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text3">
            <Icon name="SquareTerminal" size={12} /> Output
          </span>
          {result && (
            <span
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: result.ok ? "#34d399" : "#fb7185" }}
            >
              <Icon name={result.ok ? "CircleCheck" : "CircleX"} size={12} />
              {result.ok ? "ran" : "error"} · {result.durationMs}ms
            </span>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 font-mono text-[12.5px] leading-relaxed scroll-thin">
          {running && (
            <div className="flex items-center gap-2 text-text2">
              <Icon name="Loader" size={13} className="animate-spin-slow" />
              {status || "Running…"}
            </div>
          )}
          {!running && !result && (
            <div className="text-text3">
              Press <span className="text-text1">Run</span> to execute — this is real{" "}
              {lang === "python" ? "Python (CPython on WASM)" : "JavaScript"}, running
              entirely in your browser.
            </div>
          )}
          {result && (
            <>
              {result.output && (
                <pre className="whitespace-pre-wrap break-words text-text1">{result.output}</pre>
              )}
              {result.error && (
                <pre className="whitespace-pre-wrap break-words text-bad">{result.error}</pre>
              )}
              {!result.output && !result.error && (
                <span className="text-text3">(no output)</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
