"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { APP_MAP, type AppId, type WallpaperId } from "@/lib/apps";
import { ALL_WIDGETS, type WidgetId } from "@/lib/widgets";

export interface Win {
  id: string;
  appId: AppId;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  prev?: { x: number; y: number; w: number; h: number };
  launchAt: number;
}

export interface Notif {
  id: string;
  title: string;
  body: string;
  icon?: string;
  color?: string;
  ts: number;
}

export type SnapZone =
  | "left" | "right" | "top" | "bottom"
  | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  | "full";

export type BrainKind = "simulated" | "api" | "local" | "backend";

export interface WidgetPos {
  x: number;
  y: number;
}

export interface Settings {
  accent: string;
  theme: "dark" | "light";
  wallpaper: WallpaperId;
  voiceEnabled: boolean;
  reduceMotion: boolean;
  /** which intelligence source agents use */
  brain: BrainKind;
  /** legacy mirror of brain === "api"; kept for older persisted state */
  useReal: boolean;
  apiProvider: "openai" | "anthropic";
  apiKey: string;
  apiModel: string;
  /** selected in-browser model id */
  localModel: string;
  /** backend (Ollama / local server) */
  backendUrl: string;
  backendModel: string;
  /** custom agent system prompt overrides */
  customAgents: Record<string, { system: string }>;
  /** user-registered custom tools */
  customTools: CustomToolDef[];
  /** active desktop widgets */
  widgets: WidgetId[];
  /** per-widget custom positions (null = auto-layout right column) */
  widgetPositions: Partial<Record<WidgetId, WidgetPos>>;
}

export interface CustomToolDef {
  id: string;
  name: string;
  description: string;
  /** JSON string of parameter schema ({ name: { type, description } }) */
  parameters: string;
  /** JS code that runs when the tool is called */
  code: string;
  enabled: boolean;
}

interface OSState {
  booted: boolean;
  wins: Win[];
  topZ: number;
  spotlightOpen: boolean;
  controlCenterOpen: boolean;
  ariaMenuOpen: boolean;
  notifCenterOpen: boolean;
  voiceMode: boolean;
  notifs: Notif[];
  settings: Settings;

  setBooted: (b: boolean) => void;
  openApp: (appId: AppId) => void;
  closeWin: (id: string) => void;
  focusWin: (id: string) => void;
  minimizeWin: (id: string) => void;
  toggleMaximize: (id: string, viewport: { w: number; h: number }) => void;
  moveWin: (id: string, x: number, y: number) => void;
  resizeWin: (id: string, w: number, h: number, x?: number, y?: number) => void;
  snapWin: (id: string, zone: SnapZone, viewport: { w: number; h: number }) => void;
  isOpen: (appId: AppId) => boolean;

  setSpotlight: (b: boolean) => void;
  setControlCenter: (b: boolean) => void;
  setAriaMenu: (b: boolean) => void;
  setNotifCenter: (b: boolean) => void;
  setVoiceMode: (b: boolean) => void;

  notify: (n: Omit<Notif, "id" | "ts">) => void;
  dismissNotif: (id: string) => void;
  clearNotifs: () => void;

  setSettings: (p: Partial<Settings>) => void;
}

const DEFAULT_SETTINGS: Settings = {
  accent: "#7c6cff",
  theme: "dark",
  wallpaper: "aurora",
  voiceEnabled: true,
  reduceMotion: false,
  brain: "simulated",
  useReal: false,
  apiProvider: "openai",
  apiKey: "",
  apiModel: "",
  localModel: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  backendUrl: "http://localhost:11434",
  backendModel: "",
  customAgents: {},
  customTools: [],
  widgets: ALL_WIDGETS.map((w) => w.id),
  widgetPositions: {},
};

const MENU_BAR_H = 30;

function nextPosition(count: number, w: number, h: number) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const baseX = Math.max(40, (vw - w) / 2 - 80);
  const baseY = Math.max(MENU_BAR_H + 16, (vh - h) / 2 - 60);
  const off = (count % 6) * 28;
  return { x: baseX + off, y: baseY + off };
}

export const useOS = create<OSState>()(
  persist(
    (set, get) => ({
      booted: false,
      wins: [],
      topZ: 10,
      spotlightOpen: false,
      controlCenterOpen: false,
      ariaMenuOpen: false,
      notifCenterOpen: false,
      voiceMode: false,
      notifs: [],
      settings: DEFAULT_SETTINGS,

      setBooted: (b) => set({ booted: b }),

      openApp: (appId) => {
        const existing = get().wins.find((w) => w.appId === appId);
        const z = get().topZ + 1;
        if (existing) {
          set((s) => ({
            topZ: z,
            wins: s.wins.map((w) =>
              w.id === existing.id ? { ...w, minimized: false, z } : w,
            ),
          }));
          return;
        }
        const meta = APP_MAP[appId];
        const { x, y } = nextPosition(get().wins.length, meta.w, meta.h);
        const win: Win = {
          id: nanoid(8),
          appId,
          x,
          y,
          w: meta.w,
          h: meta.h,
          z,
          minimized: false,
          maximized: false,
          launchAt: Date.now(),
        };
        set((s) => ({ wins: [...s.wins, win], topZ: z }));
      },

      closeWin: (id) =>
        set((s) => ({ wins: s.wins.filter((w) => w.id !== id) })),

      focusWin: (id) => {
        const z = get().topZ + 1;
        set((s) => ({
          topZ: z,
          wins: s.wins.map((w) =>
            w.id === id ? { ...w, z, minimized: false } : w,
          ),
        }));
      },

      minimizeWin: (id) =>
        set((s) => ({
          wins: s.wins.map((w) =>
            w.id === id ? { ...w, minimized: true } : w,
          ),
        })),

      toggleMaximize: (id, viewport) =>
        set((s) => ({
          wins: s.wins.map((w) => {
            if (w.id !== id) return w;
            if (w.maximized && w.prev) {
              return { ...w, maximized: false, ...w.prev, prev: undefined };
            }
            return {
              ...w,
              maximized: true,
              prev: { x: w.x, y: w.y, w: w.w, h: w.h },
              x: 0,
              y: MENU_BAR_H,
              w: viewport.w,
              h: viewport.h - MENU_BAR_H - 84,
            };
          }),
        })),

      moveWin: (id, x, y) =>
        set((s) => ({
          wins: s.wins.map((w) => (w.id === id ? { ...w, x, y } : w)),
        })),

      resizeWin: (id, w, h, x, y) =>
        set((s) => ({
          wins: s.wins.map((win) =>
            win.id === id
              ? {
                  ...win,
                  w,
                  h,
                  x: x ?? win.x,
                  y: y ?? win.y,
                }
              : win,
          ),
        })),

      snapWin: (id, zone, viewport) =>
        set((s) => ({
          wins: s.wins.map((w) => {
            if (w.id !== id) return w;
            const prev = w.maximized ? w.prev : { x: w.x, y: w.y, w: w.w, h: w.h };
            const hw = Math.round(viewport.w / 2);
            const hh = Math.round(viewport.h / 2);
            const positions: Record<SnapZone, { x: number; y: number; w: number; h: number }> = {
              "left":        { x: 0, y: MENU_BAR_H, w: hw, h: viewport.h - MENU_BAR_H - 84 },
              "right":       { x: hw, y: MENU_BAR_H, w: hw, h: viewport.h - MENU_BAR_H - 84 },
              "top":         { x: 0, y: MENU_BAR_H, w: viewport.w, h: hh },
              "bottom":      { x: 0, y: hh, w: viewport.w, h: hh },
              "top-left":    { x: 0, y: MENU_BAR_H, w: hw, h: hh },
              "top-right":   { x: hw, y: MENU_BAR_H, w: hw, h: hh },
              "bottom-left": { x: 0, y: hh, w: hw, h: hh },
              "bottom-right":{ x: hw, y: hh, w: hw, h: hh },
              "full":        { x: 0, y: MENU_BAR_H, w: viewport.w, h: viewport.h - MENU_BAR_H - 84 },
            };
            const p = positions[zone];
            return { ...w, ...p, maximized: zone === "full", prev: zone === "full" ? prev : undefined };
          }),
        })),

      isOpen: (appId) =>
        get().wins.some((w) => w.appId === appId && !w.minimized),

      setSpotlight: (b) => set({ spotlightOpen: b }),
      setControlCenter: (b) =>
        set({ controlCenterOpen: b, notifCenterOpen: false }),
      setAriaMenu: (b) => set({ ariaMenuOpen: b }),
      setNotifCenter: (b) =>
        set({ notifCenterOpen: b, controlCenterOpen: false }),
      setVoiceMode: (b) => set({ voiceMode: b }),

      notify: (n) =>
        set((s) => ({
          notifs: [{ ...n, id: nanoid(8), ts: Date.now() }, ...s.notifs].slice(
            0,
            30,
          ),
        })),
      dismissNotif: (id) =>
        set((s) => ({ notifs: s.notifs.filter((n) => n.id !== id) })),
      clearNotifs: () => set({ notifs: [] }),

      setSettings: (p) =>
        set((s) => ({ settings: { ...s.settings, ...p } })),
    }),
    {
      name: "aria-os",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ settings: s.settings }),
      // deep-merge so newly-added settings keys keep their defaults
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<OSState>;
        const ps: Partial<Settings> = p.settings ?? {};
        return {
          ...current,
          ...p,
          settings: {
            ...current.settings,
            ...ps,
            // Append any new widget IDs not yet in the persisted list
            widgets: ps.widgets
              ? (() => {
                  const saved: WidgetId[] = ps.widgets!;
                  return [...saved, ...current.settings.widgets.filter((id) => !saved.includes(id))];
                })()
              : current.settings.widgets,
          },
        };
      },
    },
  ),
);
