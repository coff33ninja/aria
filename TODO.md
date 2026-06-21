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
- [x] **Vite vulns patched** — `npm audit fix` (2 Windows-specific vulns resolved)
- [x] **`.env.example` added** — Documents `ARIA_API_KEY`, `RATE_LIMIT_*`, `NEXT_PUBLIC_*`
- [x] **`user-select` narrowed** — Text now selectable in chat/output areas while desktop remains unselectable
- [x] **`aria-label` on dock buttons** — All dock items + Spotlight have proper labels
- [x] **Dock timeout cleanup** — `setTimeout` properly cleared on unmount
- [x] **Markdown language regex fixed** — Supports `C#`, `C++`, `TSX`, `JavaScript`
- [x] **Trailing-slash normalization bug fixed** — `embeddings/route.ts` now consistent with other routes
- [x] **Tailwind font fallbacks aligned** — `@theme inline` now matches CSS variable fallbacks
- [x] **Lint cleanup** — Removed unused imports (`sse`, `AGENTS`, `moveFileToFolder`, event param); fixed Dashboard `Date.now()` purity; fixed Settings `useEffect` deps
- [x] **tsconfig target updated** — `ES2017` → `ES2022`

## 🔴 Security (Critical Path)

- [x] **CSRF / Origin guard on API routes** — `checkOrigin` in `api-guard.ts` validates `Origin`/`Referer` against allow-list (localhost, sumanthkm.com)
- [x] **SSRF: validate `backendUrl`** — `validateUrl()` in all 5 backend proxy routes
- [x] **Runtime validation on API request bodies** — Zod schemas in `api-schemas.ts` used by all 6 API routes
- [x] **Pointer event cleanup in `Window.tsx`** — `Effect` cleanup removes orphaned `window` listeners on unmount
- [x] **`build:static` on Windows** — Added `scripts/build-static.ps1` alternative
- [x] **Redact API key from error messages** — `sanitize()` strips `[a-zA-Z0-9_-]{20,}` from upstream errors in `chat/route.ts`

## 🔴 High Impact / Unstarted

- [ ] **Voice: wake word** — "Hey Aria" trigger (currently manual button only)
- [ ] **Split `useAria.ts`** — 600+ line file doing store + orchestrator + streaming + memory
- [ ] **Split `Settings.tsx`** — 747-line file with 6 inline panel components

## 🟡 Mid-term / Feature Depth

- [ ] **i18n** — Everything is hardcoded English
- [ ] **Accessibility pass** — `aria-live` for chat, `aria-label` on Window/Assistant buttons, keyboard nav, screen reader support
- [ ] **Unit test expansion** — 13 tests across 2 files; 0 tests for stores, components, API routes
- [ ] **Deduplicate streaming SSE logic** — Shared utility for `streamOpenAI`/`streamAnthropic`
- [ ] **Dock `measure()` throttle** — `getBoundingClientRect()` on every mousemove is expensive
- [ ] **Wire `reduceMotion` setting to `MotionConfig`** — Respect user preference globally
- [ ] **Fix Markdown image URL regex** — Doesn't match URLs containing parentheses
- [ ] **Fix `auto-scroll` in Assistant** — Don't force-scroll if user has scrolled up
- [ ] **Naive HTML stripping in Wikipedia results** — Strengthen `api/search/route.ts` sanitization
- [ ] **About page screenshot carousel** — 24 screenshots exist but page only shows hero

## 🟢 Nice-to-have / Polish

- [ ] **Custom cursor / desktop icons** — No desktop icons, no context menu
- [x] **Desktop widget system** — Configurable via Settings; 4 widgets (clock, aria-status, team, stats)
- [x] **Theme system** — Light palette in `globals.css`, `data-theme` toggle via `Desktop.tsx`, Dark/Light toggle in Settings
- [x] **Align API route runtimes** — All routes now use `runtime = "edge"`
- [x] **Replace inline styles with Tailwind classes** — Window.tsx traffic-light buttons (remaining dynamic positioning/snap preview are legitimate inline uses)
- [x] **Pin Node.js version** — Add `.nvmrc` + `.node-version` (Node 20 LTS)
- [x] **Update outdated packages** — `npm update` (51 packages changed, 7 major-bumped remain)
- [x] **Clear `.next/dev/cache`** — 283 MB reclaimed
- [x] **Add `.venv` to `.gitignore`** — Future-proofing
- [x] **Add Docker support** — Dockerfile + .dockerignore
- [x] **Type `any` casts** — Desktop.tsx, Wallpaper.tsx, customTools.ts
