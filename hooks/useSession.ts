"use client";

import { useEffect, useState } from "react";

export type SessionUser = {
  userId: string;
  username: string;
  imageUrl?: string;
};

type UseSessionResult = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => void;
};

export function useSession(): UseSessionResult {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tick]);

  return { user, loading, refresh: () => setTick((t) => t + 1) };
}
