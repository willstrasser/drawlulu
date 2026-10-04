"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStorage } from "@/liveblocks.config";
import { log } from "@/lib/logger";

/** Save this long after the player stops typing. */
const DEBOUNCE_MS = 1200;
/** Final flush this long before the prompting timer runs out. */
const FLUSH_BEFORE_END_MS = 2000;

/**
 * Autosaves the player's in-progress prompt so that, if the timer runs out
 * before they press Submit, image generation still uses what they wrote.
 *
 * A draft goes through the same endpoint as a submit (it just stores the
 * text); only an explicit submit marks the player as done in presence.
 */
export function usePromptDraft({
  roomCode,
  promptId,
  disabled,
}: {
  roomCode: string;
  promptId: string;
  /** True once the player has explicitly submitted. */
  disabled: boolean;
}) {
  const timerEndsAt = useStorage((root) => root.timerEndsAt);
  const draftRef = useRef("");
  const savedRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    disabledRef.current = disabled;
    if (disabled && debounceRef.current) clearTimeout(debounceRef.current);
  }, [disabled]);

  const flush = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const text = draftRef.current.trim();
    if (disabledRef.current || !text || text === savedRef.current) return;
    savedRef.current = text;
    // keepalive lets the request finish even if this screen unmounts mid-flight
    // (which is exactly what happens when the phase flips to generating).
    fetch(`/api/games/${roomCode}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, promptText: text }),
      keepalive: true,
    }).catch((e) => {
      savedRef.current = "";
      log.error("usePromptDraft", "Failed to save prompt draft", e);
    });
  }, [roomCode, promptId]);

  const onDraftChange = useCallback(
    (text: string) => {
      draftRef.current = text;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [flush],
  );

  /** Call after an explicit submit succeeds so we don't re-send the same text. */
  const markSaved = useCallback((text: string) => {
    savedRef.current = text.trim();
  }, []);

  // Last-chance save shortly before time runs out.
  useEffect(() => {
    if (!timerEndsAt) return;
    const timeout = setTimeout(
      flush,
      Math.max(0, timerEndsAt - Date.now() - FLUSH_BEFORE_END_MS),
    );
    return () => clearTimeout(timeout);
  }, [timerEndsAt, flush]);

  // And once more when the prompt screen goes away.
  useEffect(() => flush, [flush]);

  return { onDraftChange, markSaved };
}
