"use client";

import type { AppId } from "@/lib/apps";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import Assistant from "./Assistant";
import Agents from "./Agents";
import Dashboard from "./Dashboard";
import Code from "./Code";
import Terminal from "./Terminal";
import Files from "./Files";
import Notes from "./Notes";
import Missions from "./Missions";
import Settings from "./Settings";

const APP_LABELS: Record<AppId, string> = {
  assistant: "Aria",
  agents: "Agents",
  dashboard: "Dashboard",
  code: "Code Runner",
  terminal: "Terminal",
  files: "Files",
  notes: "Notes",
  missions: "Missions",
  settings: "Settings",
};

export function AppView({ appId }: { appId: AppId; winId: string }) {
  return (
    <ErrorBoundary label={APP_LABELS[appId]}>
      <AppContent appId={appId} />
    </ErrorBoundary>
  );
}

function AppContent({ appId }: { appId: AppId }) {
  switch (appId) {
    case "assistant":
      return <Assistant />;
    case "agents":
      return <Agents />;
    case "dashboard":
      return <Dashboard />;
    case "code":
      return <Code />;
    case "terminal":
      return <Terminal />;
    case "files":
      return <Files />;
    case "notes":
      return <Notes />;
    case "missions":
      return <Missions />;
    case "settings":
      return <Settings />;
    default:
      return null;
  }
}
