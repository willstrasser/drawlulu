"use client";

import { useEffect, useState } from "react";
import { log } from "@/lib/logger";

type GameMeta = {
  categories: string[];
  hostUserId: string;
  metaError: string | null;
};

export function useGameMeta(code: string): GameMeta {
  const [categories, setCategories] = useState<string[]>([]);
  const [hostUserId, setHostUserId] = useState<string>("");
  const [metaError, setMetaError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((r) => {
        if (!r.ok) throw new Error(`GET /api/categories → ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setCategories(d.categories ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        log.error("game/meta", "categories fetch failed", e);
        setMetaError("Failed to load categories.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/games/${code}`)
      .then((r) => {
        if (!r.ok) throw new Error(`GET /api/games/${code} → ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        if (d.hostUserId) setHostUserId(d.hostUserId);
      })
      .catch((e) => {
        if (cancelled) return;
        log.error("game/meta", "hostUserId fetch failed", e);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return { categories, hostUserId, metaError };
}
