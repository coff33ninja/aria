"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useOS } from "@/store/useOS";
import Wallpaper from "./Wallpaper";
import Boot from "./Boot";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import WindowManager from "./WindowManager";
import Spotlight from "./Spotlight";
import ControlCenter from "./ControlCenter";
import Notifications from "./Notifications";

export default function Desktop() {
  const [mounted, setMounted] = useState(false);
  const booted = useOS((s) => s.booted);
  const accent = useOS((s) => s.settings.accent);
  const spotlightOpen = useOS((s) => s.spotlightOpen);
  const setSpotlight = useOS((s) => s.setSpotlight);
  const wins = useOS((s) => s.wins);
  const openApp = useOS((s) => s.openApp);

  useEffect(() => setMounted(true), []);

  // sync accent into the CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
  }, [accent]);

  // global keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "k" || e.key === " ")) {
        e.preventDefault();
        setSpotlight(!useOS.getState().spotlightOpen);
      } else if (e.key === "Escape") {
        const os = useOS.getState();
        if (os.spotlightOpen) os.setSpotlight(false);
        if (os.controlCenterOpen) os.setControlCenter(false);
        if (os.notifCenterOpen) os.setNotifCenter(false);
        if (os.ariaMenuOpen) os.setAriaMenu(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setSpotlight]);

  // open the assistant once after first boot so the OS never feels empty
  const firstOpenDone = useOS.getState().wins.length > 0;
  useEffect(() => {
    if (booted && !firstOpenDone && wins.length === 0) {
      const t = setTimeout(() => openApp("assistant"), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted]);

  if (!mounted) return <div className="fixed inset-0 bg-bg0" />;

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Wallpaper />
      <AnimatePresence>{!booted && <Boot key="boot" />}</AnimatePresence>
      {booted && (
        <>
          <MenuBar />
          <WindowManager />
          <Dock />
          <Spotlight />
          <ControlCenter />
          <Notifications />
          {/* hint chip */}
          {wins.length === 0 && !spotlightOpen && (
            <div className="pointer-events-none fixed inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-[13px] text-text2">
                  Press{" "}
                  <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[11px]">⌘K</kbd>{" "}
                  for Spotlight, or pick an app from the dock
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
