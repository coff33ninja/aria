"use client";

import { useEffect, useMemo, useState } from "react";
import { useAria } from "@/store/useAria";
import Icon from "@/components/ui/Icon";

export default function Notes() {
  const files = useAria((s) => s.files);
  const addNote = useAria((s) => s.addNote);
  const updateFile = useAria((s) => s.updateFile);
  const removeFile = useAria((s) => s.removeFile);

  const notes = useMemo(
    () => files.filter((f) => f.kind === "note" && f.createdBy === "you"),
    [files],
  );
  const [selId, setSelId] = useState<string | null>(notes[0]?.id ?? null);
  const sel = notes.find((n) => n.id === selId);

  useEffect(() => {
    if (!sel && notes.length) setSelId(notes[0].id);
  }, [notes, sel]);

  const create = () => {
    const id = addNote("Untitled note", "");
    setSelId(id);
  };

  const firstLine = (c: string) => c.split("\n")[0].slice(0, 40) || "Empty note";

  return (
    <div className="flex h-full bg-bg1/40">
      <div className="flex w-52 shrink-0 flex-col border-r border-line">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text3">
            Notes · {notes.length}
          </span>
          <button
            onClick={create}
            className="rounded-lg p-1 text-text2 hover:bg-white/10 hover:text-text0"
            title="New note"
          >
            <Icon name="Plus" size={15} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
          {notes.length === 0 && (
            <div className="p-4 text-center text-[12px] text-text3">
              No notes yet. Hit + to jot something.
            </div>
          )}
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelId(n.id)}
              className={`block w-full px-3 py-2.5 text-left ${
                sel?.id === n.id ? "bg-warn/15" : "hover:bg-white/[0.04]"
              }`}
            >
              <div className="truncate text-[12.5px] text-text0">{n.name}</div>
              <div className="truncate text-[10px] text-text3">{firstLine(n.content)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {sel ? (
          <>
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <Icon name="StickyNote" size={15} color="#fbbf24" />
              <input
                value={sel.name}
                onChange={(e) => updateFile(sel.id, { name: e.target.value })}
                className="flex-1 bg-transparent text-[13px] font-medium text-text0 outline-none"
              />
              <button
                onClick={() => {
                  removeFile(sel.id);
                  setSelId(null);
                }}
                className="rounded-lg p-1.5 text-text3 hover:bg-bad/20 hover:text-bad"
              >
                <Icon name="Trash2" size={14} />
              </button>
            </div>
            <textarea
              value={sel.content}
              onChange={(e) => updateFile(sel.id, { content: e.target.value })}
              placeholder="Start writing…"
              className="min-h-0 flex-1 resize-none bg-transparent p-4 text-[13px] leading-relaxed text-text1 outline-none placeholder:text-text3 scroll-thin"
            />
          </>
        ) : (
          <div className="grid h-full place-items-center text-center text-text3">
            <div>
              <Icon name="StickyNote" size={28} className="mx-auto mb-2 opacity-50" />
              <button onClick={create} className="text-[12px] text-accent hover:underline">
                Create your first note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
