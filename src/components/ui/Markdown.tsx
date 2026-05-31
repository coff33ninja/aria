"use client";

import React from "react";
import AsyncImage from "./AsyncImage";

/** Tiny markdown renderer: headings, bold, inline + fenced code, quotes, bullets. */
function inline(text: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(
        <strong key={`${keyBase}-b-${i}`} className="font-semibold text-text0">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <code
          key={`${keyBase}-c-${i}`}
          className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em] text-accent2"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const segments = text.split(/```/);

  segments.forEach((seg, si) => {
    if (si % 2 === 1) {
      // code block
      const lines = seg.replace(/^[a-z]*\n/, "").trimEnd();
      blocks.push(
        <pre
          key={`code-${si}`}
          className="my-2 overflow-x-auto rounded-lg border border-line bg-black/40 p-3 font-mono text-[12px] leading-relaxed text-text1 scroll-thin"
        >
          <code>{lines}</code>
        </pre>,
      );
      return;
    }
    const lines = seg.split("\n");
    let listBuf: string[] = [];
    const flush = (k: string) => {
      if (!listBuf.length) return;
      blocks.push(
        <ul key={`ul-${k}`} className="my-1 space-y-1 pl-1">
          {listBuf.map((li, idx) => (
            <li key={idx} className="flex gap-2 text-[13px] leading-relaxed text-text1">
              <span className="mt-[2px] text-accent">•</span>
              <span>{inline(li.replace(/^[•\-*]\s*/, ""), `li-${k}-${idx}`)}</span>
            </li>
          ))}
        </ul>,
      );
      listBuf = [];
    };

    lines.forEach((line, li) => {
      const key = `${si}-${li}`;
      if (/^\s*[•\-*]\s+/.test(line)) {
        listBuf.push(line);
        return;
      }
      flush(key);
      if (!line.trim()) return;
      const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
      if (img) {
        blocks.push(
          <div key={key} className="my-2">
            <AsyncImage src={img[2]} alt={img[1]} />
          </div>,
        );
        return;
      }
      if (/^#{1,3}\s/.test(line)) {
        const level = line.match(/^#+/)![0].length;
        const content = line.replace(/^#+\s/, "");
        blocks.push(
          <div
            key={key}
            className={`mt-2 font-semibold text-text0 ${
              level === 1 ? "text-[15px]" : "text-[13.5px]"
            }`}
          >
            {inline(content, key)}
          </div>,
        );
      } else if (/^>\s?/.test(line)) {
        blocks.push(
          <blockquote
            key={key}
            className="my-1.5 border-l-2 border-accent pl-3 text-[13px] italic text-text1"
          >
            {inline(line.replace(/^>\s?/, ""), key)}
          </blockquote>,
        );
      } else {
        blocks.push(
          <p key={key} className="text-[13px] leading-relaxed text-text1">
            {inline(line, key)}
          </p>,
        );
      }
    });
    flush(`end-${si}`);
  });

  return <div className="space-y-1">{blocks}</div>;
}
