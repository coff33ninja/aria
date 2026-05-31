"use client";

import { useState } from "react";
import { useAria } from "@/store/useAria";
import { AGENTS } from "@/lib/agents";
import type { FileDoc } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import Markdown from "@/components/ui/Markdown";

const KIND_ICON: Record<FileDoc["kind"], string> = {
  md: "FileText",
  code: "FileCode2",
  data: "FileBarChart2",
  note: "StickyNote",
};

export default function Files() {
  const files = useAria((s) => s.files);
  const removeFile = useAria((s) => s.removeFile);
  const [selId, setSelId] = useState<string | null>(files[0]?.id ?? null);
  const sel = files.find((f) => f.id === selId) ?? files[0];

  const author = (f: FileDoc) =>
    f.createdBy === "you" ? "You" : AGENTS[f.createdBy]?.name ?? "Aria";
  const authorColor = (f: FileDoc) =>
    f.createdBy === "you" ? "#8b93a7" : AGENTS[f.createdBy]?.color ?? "#7c6cff";

  return (
    <div className="flex h-full bg-bg1/40">
      {/* list */}
      <div className="w-56 shrink-0 overflow-y-auto border-r border-line scroll-thin">
        <div className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text3">
          Artifacts · {files.length}
        </div>
        {files.length === 0 && (
          <div className="p-4 text-center text-[12px] text-text3">
            Agent outputs land here once a mission runs.
          </div>
        )}
        {files.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelId(f.id)}
            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left ${
              sel?.id === f.id ? "bg-accent/15" : "hover:bg-white/[0.04]"
            }`}
          >
            <Icon name={KIND_ICON[f.kind]} size={16} color={authorColor(f)} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] text-text0">{f.name}</div>
              <div className="text-[10px] text-text3">{author(f)}</div>
            </div>
          </button>
        ))}
      </div>

      {/* preview */}
      <div className="flex min-w-0 flex-1 flex-col">
        {sel ? (
          <>
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <Icon name={KIND_ICON[sel.kind]} size={16} color={authorColor(sel)} />
              <span className="flex-1 truncate text-[13px] font-medium text-text0">
                {sel.name}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ background: `${authorColor(sel)}22`, color: authorColor(sel) }}
              >
                {author(sel)}
              </span>
              <button
                onClick={() => navigator.clipboard?.writeText(sel.content)}
                className="rounded-lg p-1.5 text-text3 hover:bg-white/10 hover:text-text0"
                title="Copy"
              >
                <Icon name="Copy" size={14} />
              </button>
              <button
                onClick={() => {
                  removeFile(sel.id);
                  setSelId(null);
                }}
                className="rounded-lg p-1.5 text-text3 hover:bg-bad/20 hover:text-bad"
                title="Delete"
              >
                <Icon name="Trash2" size={14} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 scroll-thin">
              {sel.kind === "code" ? (
                <pre className="overflow-x-auto rounded-lg border border-line bg-black/40 p-3 font-mono text-[12px] leading-relaxed text-text1 scroll-thin">
                  <code>{sel.content}</code>
                </pre>
              ) : (
                <Markdown text={sel.content} />
              )}
            </div>
          </>
        ) : (
          <div className="grid h-full place-items-center text-center text-text3">
            <div>
              <Icon name="FolderOpen" size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-[12px]">Select a file to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
