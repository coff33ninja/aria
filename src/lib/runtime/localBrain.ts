/**
 * LocalBrain — a real LLM running entirely in the browser via WebGPU (WebLLM).
 * No server, no API key, fully private. The model is downloaded once and cached
 * (IndexedDB / Cache API), so subsequent loads are instant.
 *
 * web-llm is dynamically imported so it never runs during SSR and stays out of
 * the main bundle until the user actually opts into a local model.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { HistoryMsg } from "@/lib/realEngine";

export interface LocalModel {
  id: string;
  label: string;
  size: string;
  note: string;
}

/** A curated set of small, browser-friendly instruct models. */
export const LOCAL_MODELS: LocalModel[] = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 · 1B",
    size: "~0.9 GB",
    note: "Best balance of quality and size",
  },
  {
    id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    label: "Qwen 2.5 · 0.5B",
    size: "~0.4 GB",
    note: "Smallest & fastest to download",
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    label: "Qwen 2.5 · 1.5B",
    size: "~1.2 GB",
    note: "Sharpest answers, larger download",
  },
];

function browserName(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Edg")) return "edge";
  if (ua.includes("Chrome")) return "chrome";
  return "other";
}

export interface BrowserSupport {
  supported: boolean;
  browser: string;
  guidance: string;
}

export function browserSupport(): BrowserSupport {
  const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
  const browser = browserName();

  if (browser === "firefox") {
    return {
      supported: hasGpu,
      browser: "Firefox",
      guidance: hasGpu
        ? "WebGPU is experimental in Firefox. If you see GPU errors, use Chrome or Edge instead."
        : 'Firefox requires WebGPU to be enabled. Go to about:config, set dom.webgpu.enabled to true, or use Chrome/Edge.',
    };
  }
  if (!hasGpu) {
    return {
      supported: false,
      browser: browser,
      guidance: "WebGPU not available. Use Chrome or Edge on desktop.",
    };
  }
  return { supported: true, browser, guidance: "" };
}

export function webgpuAvailable(): boolean {
  return browserSupport().supported;
}

let engine: any = null;
let loadedModel = "";

export function localReady(model?: string): boolean {
  if (!engine) return false;
  return model ? loadedModel === model : true;
}

export function loadedModelId(): string {
  return loadedModel;
}

export interface LoadProgress {
  progress: number; // 0..1
  text: string;
}

/** Download + initialise a model. Safe to call repeatedly; no-ops if loaded. */
export async function loadLocalModel(
  modelId: string,
  onProgress?: (p: LoadProgress) => void,
): Promise<void> {
  if (engine && loadedModel === modelId) return;
  if (!webgpuAvailable()) {
    const info = browserSupport();
    throw new Error(info.guidance || "WebGPU not available in this browser.");
  }
  const webllm = await import("@mlc-ai/web-llm");
  // unload a previously-loaded different model
  if (engine) {
    try {
      await engine.unload();
    } catch {
      /* ignore */
    }
    engine = null;
    loadedModel = "";
  }
  try {
    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (r: { progress: number; text: string }) =>
        onProgress?.({ progress: r.progress ?? 0, text: r.text ?? "" }),
    });
  } catch (e) {
    const info = browserSupport();
    const msg = e instanceof Error ? e.message : String(e);
    if (info.browser === "Firefox") {
      throw new Error(
        `${msg}\n\nFirefox WebGPU is experimental. If this keeps failing, use Chrome or Edge — no changes needed, the same model works there.`,
      );
    }
    throw e;
  }
  loadedModel = modelId;
}

/** Run a completion on the loaded local model. */
export async function localComplete(
  system: string,
  prompt: string,
  history: HistoryMsg[] = [],
): Promise<string> {
  if (!engine) throw new Error("No local model loaded");
  const res = await engine.chat.completions.create({
    messages: [
      { role: "system", content: system },
      ...history,
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });
  return res?.choices?.[0]?.message?.content || "";
}
