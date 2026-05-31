"use client";

import { useState } from "react";

/**
 * Image with a graceful loading shimmer. Generated images (keyless, free tier)
 * can take 20-30s to render, so we show a clear "generating" state instead of
 * a blank box.
 */
export default function AsyncImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div
      className={`relative aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-line ${className ?? ""}`}
    >
      {state !== "loaded" && (
        <div className="absolute inset-0 grid place-items-center shimmer">
          <span className="text-[11px] text-text3">
            {state === "error" ? "couldn't load image" : "generating image…"}
          </span>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        className={`h-full w-full object-cover transition-opacity duration-500 ${
          state === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
