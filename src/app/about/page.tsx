/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { AGENT_LIST } from "@/lib/agents";
import Icon from "@/components/ui/Icon";
import { asset } from "@/lib/env";

export const metadata: Metadata = {
  title: "Aria — the AI operating system in your browser",
  description:
    "An open-source web desktop with a live multi-agent brain. Real tools, live code execution, and a local LLM via WebGPU — no server, no key.",
  alternates: { canonical: "https://sumanthkm.com/aria/about/" },
};

const FEATURES = [
  { icon: "Network", color: "#7c6cff", title: "A real multi-agent team", body: "Seven specialists, orchestrated live. Atlas plans, the team builds in parallel, Echo reviews — every handoff streams in real time." },
  { icon: "Cpu", color: "#a78bfa", title: "A brain in your browser", body: "Download a small Llama or Qwen and run it fully on your machine via WebGPU. No server, no key, completely private." },
  { icon: "SquareTerminal", color: "#f59e0b", title: "Live code execution", body: "Real Python (CPython on WASM) and sandboxed JavaScript run in-browser. Agents don't just write code — they run it." },
  { icon: "Telescope", color: "#22d3ee", title: "Real tools, real effects", body: "Live web search with cited sources, real downloadable artifacts, and image generation. Not scripted text — actual work." },
  { icon: "Workflow", color: "#34d399", title: "Mission-control graph", body: "A live graph of agents reasoning, calling tools, and handing off — with one-click mission replay." },
  { icon: "AudioLines", color: "#f472b6", title: "Talk to it", body: "A hands-free voice mode that listens, transcribes, and speaks back. Plus a full window manager, dock, and Spotlight." },
];

const SHOWCASE = [
  { src: "/screenshots/15-graph-running.png", k: "Mission control", title: "Watch the whole team work", body: "Atlas routes the plan, specialists run in parallel, Echo reviews — nodes light up by status, edges flow on handoff, and each agent shows the tool it's using.", color: "#7c6cff" },
  { src: "/screenshots/13-code-python.png", k: "Code execution", title: "Agents that run real code", body: "Forge writes Python and JavaScript and executes it in the browser — CPython compiled to WebAssembly, JS in a sandboxed worker. Real output, real artifacts.", color: "#f59e0b" },
  { src: "/screenshots/11-live-research.png", k: "Live data", title: "Grounded in real sources", body: "Sage calls a web-search tool mid-mission and grounds findings in live, cited results — so the work is real, not hallucinated.", color: "#22d3ee" },
  { src: "/screenshots/10-voice.png", k: "Voice", title: "Speak, and it answers", body: "A JARVIS-style voice mode listens continuously, transcribes you live, and speaks back — natural, hands-free conversation with your agents.", color: "#f472b6" },
];

const BRAINS = [
  { icon: "ShieldCheck", color: "#34d399", title: "Simulated", body: "Deterministic, offline, zero-cost. Works the instant you open it — and still uses the real tools." },
  { icon: "Cpu", color: "#a78bfa", title: "Local (WebGPU)", body: "A real Llama / Qwen running entirely in your browser. No server, no key, fully private." },
  { icon: "Globe", color: "#22d3ee", title: "Your API key", body: "Bring your own OpenAI or Anthropic key for maximum capability. The key never leaves your browser." },
];

const STATS = [
  { v: "7", l: "specialist agents" },
  { v: "0", l: "servers required" },
  { v: "100%", l: "runs in your browser" },
  { v: "Free", l: "open source · Apache-2.0" },
];

export default function About() {
  return (
    <div className="h-screen overflow-y-auto bg-bg0 text-text0 scroll-thin">
      {/* nav */}
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-line px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl accent-grad text-[15px] font-bold text-white">A</span>
          <span className="text-[15px] font-semibold">Aria</span>
        </div>
        <div className="flex items-center gap-1.5">
          <a href="https://github.com/skmdroid/aria" className="hidden rounded-lg px-3 py-1.5 text-[13px] text-text1 hover:bg-white/5 sm:block">GitHub</a>
          <Link href="/" className="rounded-lg accent-grad px-3.5 py-1.5 text-[13px] font-medium text-white">Launch Aria →</Link>
        </div>
      </nav>

      {/* hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-10 text-center">
        <div className="absolute left-[15%] top-0 -z-0 h-[34rem] w-[34rem] rounded-full blur-[150px] animate-float" style={{ background: "#7c6cff2e" }} />
        <div className="absolute right-[12%] top-24 -z-0 h-[30rem] w-[30rem] rounded-full blur-[150px] animate-float" style={{ background: "#22d3ee22", animationDelay: "1.5s" }} />
        <div className="relative mx-auto max-w-3xl">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[22px] accent-grad text-4xl font-bold text-white shadow-2xl animate-float">A</div>
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1 text-[12px] text-text2">
            <span className="h-1.5 w-1.5 rounded-full bg-good" /> Open source · runs with zero setup
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            The AI operating system <span className="accent-text">in your browser</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-text2 sm:text-lg">
            Hand Aria a goal and watch a team of agents plan, research, write &amp; run real code,
            and design it — live. With a real language model running entirely on your machine.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/" className="rounded-xl accent-grad px-5 py-2.5 text-[14px] font-medium text-white shadow-lg">Launch Aria →</Link>
            <a href="https://github.com/skmdroid/aria" className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-[14px] text-text1 hover:bg-white/5">
              <Icon name="Github" size={16} /> View source
            </a>
          </div>
        </div>
        <div className="relative mx-auto mt-14 max-w-5xl">
          <div className="absolute -inset-x-10 -top-6 bottom-0 -z-0 rounded-[40px] blur-3xl" style={{ background: "radial-gradient(60% 60% at 50% 0%, #7c6cff22, transparent)" }} />
          <img src={asset("/screenshots/00-desktop-clean.png")} alt="Aria desktop — a macOS-style web OS with a multi-agent brain" className="relative w-full rounded-2xl border border-line shadow-2xl" />
        </div>
      </section>

      {/* stats */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-line bg-white/[0.02] p-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.l} className="text-center">
              <div className="accent-text text-2xl font-semibold sm:text-3xl">{s.v}</div>
              <div className="mt-1 text-[12px] text-text3">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* feature grid */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-2 text-center text-2xl font-semibold sm:text-3xl">Not a chat box. An operating system.</h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-[14px] text-text2">Every capability is real — it works the moment you open it, and gets sharper when you plug in a model.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-white/[0.02] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.04]">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${f.color}22` }}>
                <Icon name={f.icon} size={20} color={f.color} />
              </span>
              <h3 className="text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text2">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* alternating showcase */}
      <section className="mx-auto max-w-6xl space-y-20 px-6 py-16">
        {SHOWCASE.map((s, i) => (
          <div key={s.src} className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 ? "lg:[&>figure]:order-2" : ""}`}>
            <figure className="overflow-hidden rounded-2xl border border-line shadow-2xl">
              <img src={asset(s.src)} alt={s.title} className="w-full" />
            </figure>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: s.color }}>{s.k}</div>
              <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">{s.title}</h3>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-text2">{s.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* three brains */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-2 text-center text-2xl font-semibold sm:text-3xl">Three brains, one interface</h2>
        <p className="mx-auto mb-10 max-w-lg text-center text-[14px] text-text2">The agents are brain-agnostic — written once, they run on whichever source you pick.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {BRAINS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-line bg-white/[0.02] p-5 text-center">
              <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${b.color}22` }}>
                <Icon name={b.icon} size={22} color={b.color} />
              </span>
              <h3 className="text-[15px] font-semibold">{b.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text2">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* team */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-8 text-center text-2xl font-semibold">Meet the team</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {AGENT_LIST.map((a) => (
            <div key={a.id} className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white/[0.02] p-4 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${a.color}22`, border: `1px solid ${a.color}55` }}>
                <Icon name={a.icon} size={22} color={a.color} />
              </span>
              <div>
                <div className="text-[13px] font-semibold">{a.name}</div>
                <div className="text-[11px] text-text3">{a.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* tech */}
      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text3">Built with</div>
        <p className="mt-3 text-[15px] leading-relaxed text-text1">
          Next.js · React · TypeScript · Tailwind · Zustand · WebLLM (WebGPU) · Pyodide (WASM) ·
          the Web Speech API — typed end-to-end, unit-tested, CI on every push.
        </p>
      </section>

      {/* cta */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute left-1/2 top-1/2 -z-0 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]" style={{ background: "#7c6cff22" }} />
        <h2 className="relative text-3xl font-semibold sm:text-4xl">See it for yourself</h2>
        <p className="relative mx-auto mt-3 max-w-md text-[14px] text-text2">It boots in seconds and works with zero setup. Give it a mission and watch the team go.</p>
        <div className="relative mt-8">
          <Link href="/" className="rounded-xl accent-grad px-7 py-3.5 text-[15px] font-medium text-white shadow-lg">Launch Aria →</Link>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-8 text-center text-[12px] text-text3">
        Built by{" "}
        <a href="https://sumanthkm.com" className="text-text2 hover:text-text0">Sumanth Kumar M</a>{" "}
        · Open source (Apache-2.0) ·{" "}
        <a href="https://github.com/skmdroid/aria" className="text-text2 hover:text-text0">github.com/skmdroid/aria</a>
      </footer>
    </div>
  );
}
