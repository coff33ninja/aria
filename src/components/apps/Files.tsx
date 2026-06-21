"use client";

import { useState, useRef, useCallback } from "react";
import { useAria } from "@/store/useAria";
import { AGENTS } from "@/lib/agents";
import type { FileDoc } from "@/lib/types";
import Icon from "@/components/ui/Icon";
import Markdown from "@/components/ui/Markdown";
import AsyncImage from "@/components/ui/AsyncImage";

const KIND_ICON: Record<FileDoc["kind"], string> = {
  md: "FileText",
  code: "FileCode2",
  data: "FileBarChart2",
  note: "StickyNote",
  image: "Image",
};

function FileItem({ f, selId, onSelect }: { f: FileDoc; selId: string | null; onSelect: (id: string) => void }) {
  const author = (ff: FileDoc) =>
    ff.createdBy === "you" ? "You" : AGENTS[ff.createdBy]?.name ?? "Aria";
  const authorColor = (ff: FileDoc) =>
    ff.createdBy === "you" ? "#8b93a7" : AGENTS[ff.createdBy]?.color ?? "#7c6cff";

  return (
    <button
      key={f.id}
      onClick={() => onSelect(f.id)}
      className={`flex w-full items-center gap-2.5 px-3 py-2 pr-1 text-left ${
        selId === f.id ? "bg-accent/15" : "hover:bg-white/[0.04]"
      }`}
    >
      <Icon name={KIND_ICON[f.kind]} size={15} color={authorColor(f)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-text0">{f.name}</div>
        <div className="text-[10px] text-text3">{author(f)}</div>
      </div>
    </button>
  );
}

function FolderSection({
  folderId,
  folderName,
  files,
  selId,
  onSelect,
  depth,
}: {
  folderId: string;
  folderName: string;
  files: FileDoc[];
  selId: string | null;
  onSelect: (id: string) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(true);
  const renameFolder = useAria((s) => s.renameFolder);
  const removeFolder = useAria((s) => s.removeFolder);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(folderName);

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-text2 hover:bg-white/[0.04]`}
        style={{ paddingLeft: 12 + depth * 12 }}
      >
        <button onClick={() => setOpen(!open)} className="p-0.5 text-text3 hover:text-text0">
          <Icon name={open ? "ChevronDown" : "ChevronRight"} size={12} />
        </button>
        <Icon name="Folder" size={14} className="text-accent shrink-0" />
        {editing ? (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => { renameFolder(folderId, draft); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { renameFolder(folderId, draft); setEditing(false); } }}
            autoFocus
            className="flex-1 rounded bg-black/30 px-1 text-[11px] text-text0 outline-none"
          />
        ) : (
          <span
            className="flex-1 cursor-default truncate"
            onDoubleClick={() => { setDraft(folderName); setEditing(true); }}
          >
            {folderName}
          </span>
        )}
        <button
          onClick={() => removeFolder(folderId)}
          className="p-0.5 text-text3/40 hover:text-bad"
          title="Delete folder"
        >
          <Icon name="X" size={11} />
        </button>
      </div>
      {open && files.map((f) => (
        <div key={f.id} style={{ paddingLeft: 12 + (depth + 1) * 12 }}>
          <FileItem f={f} selId={selId} onSelect={onSelect} />
        </div>
      ))}
    </div>
  );
}

export default function Files() {
  const files = useAria((s) => s.files);
  const folders = useAria((s) => s.folders);
  const removeFile = useAria((s) => s.removeFile);
  const addFile = useAria((s) => s.addFile);
  const addFolder = useAria((s) => s.addFolder);
  const moveFileToFolder = useAria((s) => s.moveFileToFolder);
  const [selId, setSelId] = useState<string | null>(files[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [dragFolderId, setDragFolderId] = useState<string | undefined>(undefined);
  const dropRef = useRef<HTMLDivElement>(null);

  const sel = files.find((f) => f.id === selId) ?? null;

  const author = (f: FileDoc) =>
    f.createdBy === "you" ? "You" : AGENTS[f.createdBy]?.name ?? "Aria";
  const authorColor = (f: FileDoc) =>
    f.createdBy === "you" ? "#8b93a7" : AGENTS[f.createdBy]?.color ?? "#7c6cff";

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const items = Array.from(e.dataTransfer.items);
    const filesToAdd: { name: string; kind: FileDoc["kind"]; content: string }[] = [];

    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (!file) continue;
        const text = await file.text();
        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          filesToAdd.push({ name: file.name, kind: "image", content: url });
        } else {
          filesToAdd.push({ name: file.name, kind: "note", content: text });
        }
      }
    }

    // also handle dataTransfer.files (for browsers that don't support items)
    if (filesToAdd.length === 0) {
      for (const file of Array.from(e.dataTransfer.files)) {
        const text = await file.text();
        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          filesToAdd.push({ name: file.name, kind: "image", content: url });
        } else {
          filesToAdd.push({ name: file.name, kind: "note", content: text });
        }
      }
    }

    for (const f of filesToAdd) {
      addFile({ ...f, folderId: dragFolderId, createdBy: "you" });
    }
    setDragFolderId(undefined);
  }, [addFile, dragFolderId]);

  const rootFiles = files.filter((f) => !f.folderId);
  const searchQ = search.toLowerCase().trim();

  const filteredRoot = searchQ
    ? rootFiles.filter((f) => f.name.toLowerCase().includes(searchQ))
    : rootFiles;

  const filteredFolders = searchQ
    ? folders.filter((f) => f.name.toLowerCase().includes(searchQ))
    : folders;

  const getFolderFiles = (folderId: string) => {
    const ff = files.filter((f) => f.folderId === folderId);
    return searchQ ? ff.filter((f) => f.name.toLowerCase().includes(searchQ)) : ff;
  };

  return (
    <div
      ref={dropRef}
      className={`flex h-full bg-bg1/40 ${dragOver ? "ring-2 ring-accent ring-inset" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* sidebar */}
      <div className="w-56 shrink-0 overflow-y-auto border-r border-line scroll-thin">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Icon name="FolderOpen" size={15} className="text-accent" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text3">
            Files · {files.length}
          </span>
        </div>

        {/* search */}
        <div className="px-2 pb-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-black/20 px-2 py-1.5 text-[12px] text-text3 focus-within:border-accent">
            <Icon name="Search" size={13} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              className="min-w-0 flex-1 bg-transparent text-text0 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="p-0.5 text-text3 hover:text-text0">
                <Icon name="X" size={12} />
              </button>
            )}
          </div>
        </div>

        {/* new folder button */}
        <div className="px-2 pb-1.5">
          <button
            onClick={() => {
              const name = prompt("Folder name:");
              if (name?.trim()) addFolder(name.trim());
            }}
            className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-line px-2 py-1.5 text-[11px] text-text3 hover:border-accent hover:text-text0"
          >
            <Icon name="FolderPlus" size={13} /> New folder
          </button>
        </div>

        {files.length === 0 && (
          <div className="p-4 text-center text-[12px] text-text3">
            Drop files here or wait for agent outputs.
          </div>
        )}

        {/* uncategorised files */}
        {filteredRoot.map((f) => (
          <FileItem key={f.id} f={f} selId={selId} onSelect={setSelId} />
        ))}

        {/* folder sections */}
        {filteredFolders.map((fol) => {
          const ff = getFolderFiles(fol.id);
          return (
            <FolderSection
              key={fol.id}
              folderId={fol.id}
              folderName={fol.name}
              files={ff}
              selId={selId}
              onSelect={setSelId}
              depth={0}
            />
          );
        })}

        {/* drop zone hint */}
        {dragOver && (
          <div className="mx-2 mt-2 rounded-lg border-2 border-dashed border-accent/50 p-3 text-center text-[11px] text-accent">
            Drop to {dragFolderId ? "folder" : "root"}
          </div>
        )}
      </div>

      {/* preview */}
      <div className="flex min-w-0 flex-1 flex-col">
        {sel ? (
          <>
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <div
                className="flex cursor-grab items-center gap-1 rounded-lg px-1.5 py-0.5 text-text3 hover:bg-white/5"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", sel.id);
                  const folderEl = dropRef.current?.querySelector('[data-folder-drop]');
                  if (folderEl) {
                    e.dataTransfer.effectAllowed = "move";
                  }
                }}
              >
                <Icon name="GripVertical" size={12} />
              </div>
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
                  if (sel.kind === "image") {
                    window.open(sel.content, "_blank");
                    return;
                  }
                  const blob = new Blob([sel.content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = sel.name;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded-lg p-1.5 text-text3 hover:bg-white/10 hover:text-text0"
                title="Download"
              >
                <Icon name="Download" size={14} />
              </button>
              <button
                onClick={() => {
                  removeFile(sel.id);
                  setSelId(files[0]?.id ?? null);
                }}
                className="rounded-lg p-1.5 text-text3 hover:bg-bad/20 hover:text-bad"
                title="Delete"
              >
                <Icon name="Trash2" size={14} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 scroll-thin">
              {sel.kind === "image" ? (
                <AsyncImage src={sel.content} alt={sel.name} className="max-w-md" />
              ) : sel.kind === "code" ? (
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

        {/* drop overlay */}
        {dragOver && (
          <div
            className="absolute inset-0 z-10 bg-accent/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleDrop(e);
            }}
          />
        )}
      </div>
    </div>
  );
}
