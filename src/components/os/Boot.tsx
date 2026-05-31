"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOS } from "@/store/useOS";
import { AGENT_LIST } from "@/lib/agents";
import AgentAvatar from "@/components/ui/AgentAvatar";

const STEPS = [
  "Waking the kernel",
  "Mounting agent runtime",
  "Calibrating Atlas",
  "Loading specialist roster",
  "Warming the voice core",
  "Aria is ready",
];

export default function Boot() {
  const setBooted = useOS((s) => s.setBooted);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tProg = setInterval(() => {
      setProgress((p) => Math.min(100, p + 2 + Math.random() * 5));
    }, 70);
    const tStep = setInterval(() => {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }, 520);
    const done = setTimeout(() => setBooted(true), 3300);
    return () => {
      clearInterval(tProg);
      clearInterval(tStep);
      clearTimeout(done);
    };
  }, [setBooted]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] grid place-items-center bg-bg0"
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="absolute h-[36rem] w-[36rem] rounded-full blur-[140px]"
        style={{ background: "#7c6cff20" }}
      />
      <div className="relative flex flex-col items-center gap-8">
        {/* logo orb */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative grid h-28 w-28 place-items-center rounded-[28px] accent-grad animate-float"
          style={{ boxShadow: "0 0 60px #7c6cff66" }}
        >
          <span className="text-5xl font-bold text-white">A</span>
          <div className="absolute inset-0 rounded-[28px] border border-white/20" />
        </motion.div>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Aria</h1>
          <p className="mt-1 text-sm text-text2">your AI operating system</p>
        </div>

        {/* agent ring fade-in */}
        <div className="flex gap-2">
          {AGENT_LIST.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              <AgentAvatar id={a.id} size={30} ring />
            </motion.div>
          ))}
        </div>

        {/* progress */}
        <div className="w-72">
          <div className="h-1 overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full accent-grad"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3 text-center text-xs text-text3"
            >
              {STEPS[step]}
              {step < STEPS.length - 1 && <span className="caret" />}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
