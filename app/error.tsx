"use client";

import { useEffect } from "react";
import { log } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("app/error", "route boundary caught", error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="relative z-10 min-h-screen text-gray-900 flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Something went wrong.</h1>
      <p className="text-gray-600 text-sm max-w-md text-center">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-riso-teal text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
