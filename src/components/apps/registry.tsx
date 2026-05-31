"use client";

import type { AppId } from "@/lib/apps";
import Assistant from "./Assistant";
import Agents from "./Agents";
import Dashboard from "./Dashboard";
import Terminal from "./Terminal";
import Files from "./Files";
import Notes from "./Notes";
import Settings from "./Settings";

export function AppView({ appId }: { appId: AppId; winId: string }) {
  switch (appId) {
    case "assistant":
      return <Assistant />;
    case "agents":
      return <Agents />;
    case "dashboard":
      return <Dashboard />;
    case "terminal":
      return <Terminal />;
    case "files":
      return <Files />;
    case "notes":
      return <Notes />;
    case "settings":
      return <Settings />;
    default:
      return null;
  }
}
