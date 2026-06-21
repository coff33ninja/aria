export type WidgetId = "clock" | "aria-status" | "team" | "stats" | "recent-missions" | "brain-status" | "quick-mission" | "notifications" | "agent-activity" | "quick-actions";

export interface WidgetMeta {
  id: WidgetId;
  name: string;
  desc: string;
}

export const ALL_WIDGETS: WidgetMeta[] = [
  { id: "clock", name: "Clock", desc: "Current date and time" },
  { id: "aria-status", name: "Aria Status", desc: "Agent activity indicator" },
  { id: "team", name: "The Team", desc: "Agent avatars grid" },
  { id: "stats", name: "Mission Stats", desc: "Mission and artifact counts" },
  { id: "recent-missions", name: "Recent Missions", desc: "Latest mission summaries" },
  { id: "brain-status", name: "Brain Status", desc: "Current AI brain and model" },
  { id: "quick-mission", name: "Quick Mission", desc: "Launch a mission from the desktop" },
  { id: "notifications", name: "Notifications", desc: "Recent OS notifications" },
  { id: "agent-activity", name: "Agent Activity", desc: "Live agent communication feed" },
  { id: "quick-actions", name: "Quick Actions", desc: "Common app shortcuts" },
];
