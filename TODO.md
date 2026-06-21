# Aria Roadmap TODO

> Checked items are implemented. Tracked in `todo.md` and via `todowrite` tool.

## 🔴 High Impact / Core Experience

- [ ] **Error boundaries** — Add React error boundaries so one crash doesn't take down the whole desktop
- [ ] **Window snapping + tiling** — Leverage Next.js 16 `window-management` API with the existing Window system
- [ ] **SSE streaming for BYO-key API** — `/api/chat` returns JSON only; stream OpenAI/Anthropic responses
- [ ] **Real dashboard metrics** — Throughput chart renders actual agent timing/token data from stored missions instead of fake sine wave
- [ ] **Agent status persistence** — Badges revert to idle after 2.5s; should persist until next mission

## 🟡 Mid-term / Feature Depth

- [ ] **Mission history browser** — Dedicated view to browse/search all past missions (not just last 5 on Dashboard)
- [ ] **Replayable mission timeline** — Step-by-step scrubbing through a past mission's events
- [ ] **Full memory system** — Use backend brain embeddings for vector search across past conversations/files
- [ ] **Pluggable custom tools UI** — UI to register/configure new custom tools (backend exists)
- [ ] **PWA + offline support** — Service worker, manifest, offline fallback
- [ ] **Files: folders, search, drag-drop** — Organization beyond flat list
- [ ] **Voice: wake word** — "Hey Aria" trigger (currently manual button)
- [ ] **Auth / rate limiting on API routes** — SSRF risk, no auth on `/api/chat`, `/api/backend/*`
- [ ] **Multi-line terminal** — `js`/`py` commands only accept single-line expressions

## 🟢 Nice-to-have / Polish

- [ ] **More wallpapers (animated/live)** — CSS animated or WebGL wallpapers
- [ ] **i18n** — Everything is hardcoded English
- [ ] **Accessibility pass** — ARIA labels, keyboard nav, `user-select` fixes
- [ ] **Unit test expansion** — 13 tests across 2 files; 0 tests for stores, components, API routes
- [ ] **Split `useAria.ts`** — 600-line file doing store + orchestrator + streaming + memory
- [ ] **About page screenshot carousel** — 24 screenshots but about page only shows hero
- [ ] **Custom cursor / desktop icons** — No desktop icons, no context menu
