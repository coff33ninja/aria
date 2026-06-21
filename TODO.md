# Aria Roadmap TODO

> Checked items are implemented. Tracked via `todowrite` tool.

## ✅ Done

- [x] **Error boundaries** — React error boundaries wrapping OS surfaces and each app individually
- [x] **Mission history browser** — Dedicated Missions app with searchable sidebar + detail panel
- [x] **Replayable mission timeline** — TimelineReplay with step-through scrubber and agent state grid
- [x] **Window snapping + tiling** — 9-zone snap (drag detection + Alt+Arrow keyboard shortcuts)
- [x] **Real dashboard metrics** — Cumulative missions chart, token sparkline, avg task duration from real data
- [x] **SSE streaming for BYO-key API** — `/api/chat` streams OpenAI/Anthropic token-by-token
- [x] **Agent status persistence** — Badges persist as "done" until next mission resets them
- [x] **Full memory system** — Backend brain embeddings, `MemoryStore` class, `embedAndStore`, memory-injected system prompts
- [x] **Pluggable custom tools UI + execution** — Settings panel, agent prompt injection, `runCustomTool()` execution
- [x] **PWA + offline support** — Service worker (cache-first static), web manifest, offline fallback
- [x] **Files: folders, search, drag-drop** — `FolderDoc` type, collapsible tree, search bar, OS file drop upload
- [x] **Auth / rate limiting on API routes** — `ARIA_API_KEY` bearer check, per-IP sliding window rate limiter
- [x] **Multi-line terminal** — `<textarea>` with Shift+Enter for newlines, Enter to exec
- [x] **More wallpapers (animated)** — Pulse, Drift, Aurora Live with CSS keyframe overlay animations

## 🔴 High Impact / Unstarted

- [ ] **Voice: wake word** — "Hey Aria" trigger (currently manual button only)
- [ ] **Split `useAria.ts`** — 600+ line file doing store + orchestrator + streaming + memory

## 🟡 Mid-term / Feature Depth

- [ ] **i18n** — Everything is hardcoded English
- [ ] **Accessibility pass** — ARIA labels, keyboard nav, `user-select` fixes
- [ ] **Unit test expansion** — 13 tests across 2 files; 0 tests for stores, components, API routes
- [ ] **About page screenshot carousel** — 24 screenshots exist but page only shows hero

## 🟢 Nice-to-have / Polish

- [ ] **Custom cursor / desktop icons** — No desktop icons, no context menu
- [ ] **Desktop widget system** — User-configurable widgets on the desktop surface
- [ ] **Theme system** — Beyond accent color; light mode, custom themes
