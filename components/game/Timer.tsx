"use client";

import { useStorage } from "@/liveblocks.config";
import { useEffect, useState } from "react";

export function Timer() {
  const timerEndsAt = useStorage((root) => root.timerEndsAt);
  // `now` is the only state that the interval mutates; everything else is
  // derived from props on render. This keeps the effect to "subscribe to a
  // ticking external clock" and avoids cascading setState within an effect.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timerEndsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [timerEndsAt]);

  if (!timerEndsAt) return null;

  const secondsLeft = Math.max(0, Math.ceil((timerEndsAt - now) / 1000));
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
