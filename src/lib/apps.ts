/** App registry metadata — kept free of React imports so stores can use it. */

export type AppId =
  | "assistant"
  | "agents"
  | "dashboard"
  | "terminal"
  | "files"
  | "notes"
  | "settings";

export interface AppMeta {
  id: AppId;
  name: string;
  /** lucide-react icon name */
  icon: string;
  color: string;
  /** default window size */
  w: number;
  h: number;
  minW: number;
  minH: number;
  /** show in the dock */
  dock: boolean;
}

export const APPS: AppMeta[] = [
  {
    id: "assistant",
    name: "Aria",
    icon: "Sparkles",
    color: "#7c6cff",
    w: 460,
    h: 640,
    minW: 360,
    minH: 420,
    dock: true,
  },
  {
    id: "agents",
    name: "Agents",
    icon: "Network",
    color: "#22d3ee",
    w: 920,
    h: 620,
    minW: 640,
    minH: 440,
    dock: true,
  },
  {
    id: "dashboard",
    name: "Dashboard",
    icon: "LayoutDashboard",
    color: "#34d399",
    w: 840,
    h: 580,
    minW: 560,
    minH: 420,
    dock: true,
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: "SquareTerminal",
    color: "#f59e0b",
    w: 680,
    h: 460,
    minW: 420,
    minH: 280,
    dock: true,
  },
  {
    id: "files",
    name: "Files",
    icon: "FolderOpen",
    color: "#60a5fa",
    w: 760,
    h: 520,
    minW: 480,
    minH: 360,
    dock: true,
  },
  {
    id: "notes",
    name: "Notes",
    icon: "StickyNote",
    color: "#fbbf24",
    w: 560,
    h: 520,
    minW: 360,
    minH: 320,
    dock: true,
  },
  {
    id: "settings",
    name: "Settings",
    icon: "Settings",
    color: "#8b93a7",
    w: 620,
    h: 560,
    minW: 460,
    minH: 400,
    dock: true,
  },
];

export const APP_MAP: Record<AppId, AppMeta> = Object.fromEntries(
  APPS.map((a) => [a.id, a]),
) as Record<AppId, AppMeta>;

export const WALLPAPERS = [
  { id: "aurora", name: "Aurora", css: "radial-gradient(120% 120% at 20% 0%, #1b1146 0%, #0a0c14 45%, #05060a 100%)" },
  { id: "nebula", name: "Nebula", css: "radial-gradient(100% 100% at 80% 10%, #0d2a3a 0%, #0a0c14 50%, #05060a 100%)" },
  { id: "ember", name: "Ember", css: "radial-gradient(120% 120% at 30% 100%, #3a1428 0%, #120a14 50%, #05060a 100%)" },
  { id: "forest", name: "Forest", css: "radial-gradient(120% 120% at 70% 20%, #0c2a1f 0%, #0a1410 50%, #05060a 100%)" },
  { id: "void", name: "Void", css: "radial-gradient(140% 140% at 50% 30%, #0e1020 0%, #070810 55%, #04040a 100%)" },
] as const;

export type WallpaperId = (typeof WALLPAPERS)[number]["id"];
