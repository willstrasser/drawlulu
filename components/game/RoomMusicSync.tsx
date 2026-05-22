"use client";

import { useEffect } from "react";
import { useStorage } from "@/liveblocks.config";
import { useStorageMutations } from "@/hooks/useStorageMutations";
import { useBackgroundMusic } from "@/components/ui/BackgroundMusic";

/**
 * Syncs the global background audio with Liveblocks room storage so all
 * players in a game hear the same track at roughly the same position.
 *
 * - Anyone clicking the music toggle while in-room writes `musicStartedAt`
 *   (start) or `null` (stop) to room storage.
 * - When that field changes, every client seeks to
 *   `(Date.now() - musicStartedAt) % audio.duration` and resumes playback.
 * - Render returns null — this is a behavioral component only.
 */
export function RoomMusicSync() {
  const { audioRef, setRoomController } = useBackgroundMusic();
  const musicStartedAt = useStorage((root) => root.musicStartedAt);
  const { setMusicStartedAt } = useStorageMutations();

  // Apply the room's playback state to the local <audio> element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (musicStartedAt == null) {
      el.pause();
      return;
    }

    let cancelled = false;

    const sync = () => {
      if (cancelled) return;
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur <= 0) {
        // Metadata isn't loaded yet — kick it and retry when ready.
        el.load();
        el.addEventListener("loadedmetadata", sync, { once: true });
        return;
      }
      const elapsedSec = (Date.now() - musicStartedAt) / 1000;
      el.currentTime = ((elapsedSec % dur) + dur) % dur;
      el.play().catch(() => {
        // Autoplay blocked — retry once the user clicks anywhere.
        const resume = () => {
          el.play().catch(() => {});
        };
        window.addEventListener("pointerdown", resume, { once: true });
      });
    };

    sync();

    return () => {
      cancelled = true;
    };
  }, [musicStartedAt, audioRef]);

  // Register the room-wide toggle so the global BackgroundMusic button drives
  // shared state instead of local state while we're inside a room.
  useEffect(() => {
    const playing = musicStartedAt != null;
    const toggle = () => {
      setMusicStartedAt(playing ? null : Date.now());
    };
    setRoomController({ playing, toggle });
    return () => setRoomController(null);
  }, [musicStartedAt, setMusicStartedAt, setRoomController]);

  return null;
}
