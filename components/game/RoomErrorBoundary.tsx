"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RoomErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="relative z-10 min-h-screen text-foreground flex items-center justify-center">
          <div className="text-center max-w-sm">
            <p className="text-lg font-semibold mb-2">Connection failed</p>
            <p className="text-sm text-gray-500 mb-6">
              Could not connect to the game room. Check your connection and try
              again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
