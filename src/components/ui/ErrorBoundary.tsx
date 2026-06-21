"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import Icon from "./Icon";

interface Props {
  children: ReactNode;
  /** Fallback component shown instead of default crash UI */
  fallback?: ReactNode;
  /** Label shown in the crash message (e.g. "Assistant", "Dashboard") */
  label?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-red-500/20">
            <Icon name="AlertTriangle" size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-text1">
              {this.props.label || "Something went wrong"}
            </p>
            <p className="mt-1 max-w-[280px] text-[12px] text-text3 leading-relaxed">
              {this.state.error.message}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="cursor-pointer rounded-lg bg-white/10 px-4 py-1.5 text-[12px] font-medium text-text1 transition-colors hover:bg-white/15 active:scale-95"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
