"use client";

import { WALLPAPERS } from "@/lib/apps";
import { useOS } from "@/store/useOS";

export default function Wallpaper() {
  const wallpaper = useOS((s) => s.settings.wallpaper);
  const accent = useOS((s) => s.settings.accent);
  const reduceMotion = useOS((s) => s.settings.reduceMotion);
  const wp = WALLPAPERS.find((w) => w.id === wallpaper) ?? WALLPAPERS[0];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: wp.css }}>
      <div
        className={`absolute -left-40 -top-40 h-[42rem] w-[42rem] rounded-full blur-[120px] ${
          reduceMotion ? "" : "animate-float"
        }`}
        style={{ background: `${accent}22` }}
      />
      <div
        className={`absolute -bottom-52 -right-40 h-[40rem] w-[40rem] rounded-full blur-[120px] ${
          reduceMotion ? "" : "animate-float"
        }`}
        style={{ background: "#22d3ee18", animationDelay: "1.4s" }}
      />
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
