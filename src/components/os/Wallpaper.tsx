"use client";

import { WALLPAPERS } from "@/lib/apps";
import { useOS } from "@/store/useOS";

export default function Wallpaper() {
  const wallpaper = useOS((s) => s.settings.wallpaper);
  const reduceMotion = useOS((s) => s.settings.reduceMotion);
  const wp = WALLPAPERS.find((w) => w.id === wallpaper) ?? WALLPAPERS[0];
  const isAnimated = "animation" in wp && !reduceMotion;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* base mesh gradient */}
      <div className="absolute inset-0" style={{ background: wp.css }} />

      {/* animated overlay layers */}
      {isAnimated && (
        <>
          {(wp as any).colors.map((c: string, i: number) => (
            <div
              key={i}
              className="absolute inset-0 opacity-0 mix-blend-screen"
              style={{
                background: `radial-gradient(60% 70% at ${30 + i * 20}% ${20 + i * 15}%, ${c} 0%, transparent 55%)`,
                animation: `${(wp as any).animation} ${6 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * 1.5}s`,
              }}
            />
          ))}
        </>
      )}

      {/* floating light blooms for life */}
      <div
        className={`absolute left-[8%] top-[6%] h-[34rem] w-[34rem] rounded-full blur-[110px] mix-blend-screen ${
          reduceMotion ? "" : "animate-float"
        }`}
        style={{ background: "rgba(160,120,255,0.28)" }}
      />
      <div
        className={`absolute -bottom-32 right-[6%] h-[32rem] w-[32rem] rounded-full blur-[120px] mix-blend-screen ${
          reduceMotion ? "" : "animate-float"
        }`}
        style={{ background: "rgba(60,200,230,0.22)", animationDelay: "1.6s" }}
      />

      {/* top sheen */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)",
        }}
      />

      {/* vignette so chrome reads */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* fine grain */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
