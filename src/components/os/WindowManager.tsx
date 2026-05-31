"use client";

import { AnimatePresence } from "framer-motion";
import { useOS } from "@/store/useOS";
import Window from "./Window";

export default function WindowManager() {
  const wins = useOS((s) => s.wins);
  return (
    <AnimatePresence>
      {wins
        .filter((w) => !w.minimized)
        .map((w) => (
          <Window key={w.id} win={w} />
        ))}
    </AnimatePresence>
  );
}
