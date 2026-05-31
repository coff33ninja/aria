/**
 * Real, sandboxed code execution in the browser.
 * - JavaScript runs in a Web Worker (isolated, terminable, timed-out).
 * - Python runs on Pyodide (CPython compiled to WASM), lazy-loaded from CDN.
 *
 * This is what lets Forge actually *run* the code it writes.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ExecResult {
  ok: boolean;
  output: string;
  error?: string;
  durationMs: number;
}

/* ───────────────────────────── JavaScript ───────────────────────────── */

const JS_WORKER = `
self.onmessage = async (ev) => {
  const logs = [];
  const fmt = (a) => a.map((x) => {
    try { return typeof x === "object" ? JSON.stringify(x) : String(x); }
    catch { return String(x); }
  }).join(" ");
  self.console = {
    log: (...a) => logs.push(fmt(a)),
    info: (...a) => logs.push(fmt(a)),
    warn: (...a) => logs.push(fmt(a)),
    error: (...a) => logs.push("⚠ " + fmt(a)),
    debug: (...a) => logs.push(fmt(a)),
  };
  try {
    const fn = new Function("return (async () => {\\n" + ev.data.code + "\\n})()");
    const ret = await fn();
    if (ret !== undefined) logs.push(typeof ret === "object" ? JSON.stringify(ret, null, 2) : String(ret));
    self.postMessage({ ok: true, output: logs.join("\\n") });
  } catch (err) {
    self.postMessage({ ok: false, output: logs.join("\\n"), error: String((err && err.message) || err) });
  }
};
`;

export function runJs(code: string, timeoutMs = 5000): Promise<ExecResult> {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let worker: Worker;
    try {
      const url = URL.createObjectURL(
        new Blob([JS_WORKER], { type: "application/javascript" }),
      );
      worker = new Worker(url);
    } catch (e) {
      resolve({ ok: false, output: "", error: String(e), durationMs: 0 });
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false,
        output: "",
        error: `Timed out after ${timeoutMs / 1000}s`,
        durationMs: timeoutMs,
      });
    }, timeoutMs);
    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ...e.data, durationMs: Math.round(performance.now() - t0) });
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({
        ok: false,
        output: "",
        error: e.message || "Worker error",
        durationMs: Math.round(performance.now() - t0),
      });
    };
    worker.postMessage({ code });
  });
}

/* ───────────────────────────── Python (Pyodide) ───────────────────────────── */

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise: Promise<any> | null = null;

export function pyodideLoaded(): boolean {
  return !!(typeof window !== "undefined" && (window as any).__ariaPyodide);
}

export async function loadPyodide(
  onStatus?: (s: string) => void,
): Promise<any> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    if (!(window as any).loadPyodide) {
      onStatus?.("Downloading Python runtime…");
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script");
        s.src = `${PYODIDE_URL}pyodide.js`;
        s.onload = () => res();
        s.onerror = () => rej(new Error("Failed to load Pyodide"));
        document.head.appendChild(s);
      });
    }
    onStatus?.("Booting Python…");
    const py = await (window as any).loadPyodide({ indexURL: PYODIDE_URL });
    (window as any).__ariaPyodide = py;
    return py;
  })();
  return pyodidePromise;
}

export async function runPython(
  code: string,
  onStatus?: (s: string) => void,
): Promise<ExecResult> {
  const t0 = performance.now();
  try {
    const py = await loadPyodide(onStatus);
    onStatus?.("Running…");
    py.runPython(
      "import sys, io\n_aria_buf = io.StringIO()\nsys.stdout = _aria_buf\nsys.stderr = _aria_buf",
    );
    try {
      const ret = await py.runPythonAsync(code);
      let out = py.runPython("_aria_buf.getvalue()") as string;
      if (ret !== undefined && ret !== null) {
        out += (out ? "\n" : "") + String(ret);
      }
      return {
        ok: true,
        output: out || "(no output)",
        durationMs: Math.round(performance.now() - t0),
      };
    } catch (e: any) {
      const out = (py.runPython("_aria_buf.getvalue()") as string) || "";
      const msg = String(e?.message || e).split("\n").slice(-4).join("\n");
      return {
        ok: false,
        output: out,
        error: msg,
        durationMs: Math.round(performance.now() - t0),
      };
    } finally {
      py.runPython("sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__");
    }
  } catch (e: any) {
    return {
      ok: false,
      output: "",
      error: String(e?.message || e),
      durationMs: Math.round(performance.now() - t0),
    };
  }
}

export async function runCode(
  lang: "python" | "javascript",
  code: string,
  onStatus?: (s: string) => void,
): Promise<ExecResult> {
  return lang === "python" ? runPython(code, onStatus) : runJs(code);
}
