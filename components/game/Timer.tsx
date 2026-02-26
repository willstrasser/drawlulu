"use client";

import { useStorage } from "@/liveblocks.config";
import { useEffect, useState } from "react";

export function Timer() {
  const timerEndsAt = useStorage((root) => root.timerEndsAt);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!timerEndsAt) {
      setSecondsLeft(null);
      return;
    }

    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((timerEndsAt - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timerEndsAt]);

  if (secondsLeft === null) return null;

  const isUrgent = secondsLeft <= 10;

  return (
    <div
      className={`text-center text-4xl font-bold tabular-nums ${
        isUrgent ? "text-riso-red animate-pulse" : "text-gray-900"
      }`}
    >
      {secondsLeft}s
    </div>
  );
}
