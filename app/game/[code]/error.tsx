"use client";

import { useEffect } from "react";
import Link from "next/link";
import { log } from "@/lib/logger";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("game/error", "route boundary caught", error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="relative z-10 min-h-screen text-foreground flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Game error</h1>
      <p className="text-gray-600 text-sm max-w-md text-center">
        {error.message || "Something broke loading this game."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 border-2 border-border/10 rounded-lg text-sm font-medium hover:bg-foreground/5 transition-colors"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
