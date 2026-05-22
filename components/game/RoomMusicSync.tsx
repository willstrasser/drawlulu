"use client";

import { useEffect, useState } from "react";
import { useStorage } from "@/liveblocks.config";
import { useStorageMutations } from "@/hooks/useStorageMutations";
import { useBackgroundMusic } from "@/components/ui/BackgroundMusic";
import { getServerTimeOffset, serverNow } from "@/lib/server-time";

// How often we re-check the audio element's position vs. expected.
const CORRECTION_INTERVAL_MS = 2_000;
// Drift threshold above which we hard-seek. Below this we leave it alone —
// the time-stretching artifacts of `playbackRate` are more noticeable on music
// than a single ~100 ms jump on the next loop.
const DRIFT_THRESHOLD_S = 0.1;

/**
 * Syncs the global background audio with Liveblocks room storage so all
 * players in a game hear the track at the same wall-clock position.
 *
 * Sync strategy:
 *  - All clients measure their offset from a shared server clock at mount
 *    (lib/server-time.ts, NTP-style RTT). Writes and reads of `musicStartedAt`
 *    happen in server-time units, immune to each client's `Date.now()` skew.
 *  - When `musicStartedAt` changes, each client seeks to
 *    `(serverNow - musicStartedAt) % duration` and plays.
 *  - A 2s interval re-checks position vs. expected and hard-seeks if drift
 *    exceeds 100 ms (handles audio-clock drift and tab throttling).
 *  - Re-runs the correction when the tab regains focus, since background
 *    tabs commonly throttle setInterval.
 */
export function RoomMusicSync() {
  const { audioRef, setRoomController } = useBackgroundMusic();
  const musicStartedAt = useStorage((root) => root.musicStartedAt);
  const { setMusicStartedAt } = useStorageMutations();
  const [offset, setOffset] = useState<number | null>(null);

  // Measure clock offset once per page load. Until it's ready we treat the
  // offset as 0 (which falls back to the previous wall-clock behavior).
  useEffect(() => {
    let cancelled = false;
    getServerTimeOffset().then((o) => {
      if (!cancelled) setOffset(o);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply the room's playback state to the local <audio> element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (musicStartedAt == null) {
      el.pause();
      el.playbackRate = 1.0;
      return;
    }

    let cancelled = false;
    const off = offset ?? 0;

    const expectedPosition = (dur: number): number => {
      const elapsedSec = (serverNow(off) - musicStartedAt) / 1000;
      return ((elapsedSec % dur) + dur) % dur;
    };

    const seekAndPlay = () => {
      if (cancelled) return;
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur <= 0) {
        el.load();
        el.addEventListener("loadedmetadata", seekAndPlay, { once: true });
        return;
      }
      el.currentTime = expectedPosition(dur);
      el.play().catch(() => {
        const resume = () => {
          el.play().catch(() => {});
        };
        window.addEventListener("pointerdown", resume, { once: true });
      });
    };

    const correct = () => {
      if (cancelled || el.paused) return;
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      const expected = expectedPosition(dur);
      let diff = expected - el.currentTime;
      // Loop-seam wraparound: prefer the shorter distance around the loop.
      if (diff > dur / 2) diff -= dur;
      else if (diff < -dur / 2) diff += dur;
      if (Math.abs(diff) > DRIFT_THRESHOLD_S) {
        el.currentTime = expected;
      }
    };

    seekAndPlay();
    const id = window.setInterval(correct, CORRECTION_INTERVAL_MS);
    const onVisibility = () => {
      if (!document.hidden) correct();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [musicStartedAt, offset, audioRef]);

  // Register the room-wide toggle so the global BackgroundMusic button drives
  // shared state instead of local state while we're inside a room. Writes use
  // server time so every reader's seek lands on the same wall-clock position.
  useEffect(() => {
    const playing = musicStartedAt != null;
    const off = offset ?? 0;
    const toggle = () => {
      setMusicStartedAt(playing ? null : serverNow(off));
    };
    setRoomController({ playing, toggle });
    return () => setRoomController(null);
  }, [musicStartedAt, offset, setMusicStartedAt, setRoomController]);

  return null;
}
