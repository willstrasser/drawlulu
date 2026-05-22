"use client";

import { useEffect } from "react";
import { useStorage } from "@/liveblocks.config";
import { useStorageMutations } from "@/hooks/useStorageMutations";
import { useBackgroundMusic } from "@/components/ui/BackgroundMusic";

// Re-check expected vs. actual playback position every 5s.
const CORRECTION_INTERVAL_MS = 5_000;
// Drift this large means the audio clock has slipped enough to be worth a
// jump-cut. Smaller drift is left alone — a hard seek is more noticeable on
// music than a quarter-second of phase drift.
const DRIFT_THRESHOLD_S = 0.25;

/**
 * Syncs the global background audio with Liveblocks room storage so all
 * players in a game hear the track at roughly the same position.
 *
 * - When `musicStartedAt` flips between null and a timestamp, each client
 *   seeks to `(Date.now() - musicStartedAt) % audio.duration` and starts/
 *   stops playback.
 * - A 5s interval re-checks the expected position against
 *   `audio.currentTime` and only hard-seeks if drift exceeds 250 ms — this
 *   catches cumulative audio-clock drift without re-seeking on every effect
 *   run, which was the source of the audible hiccups in the previous
 *   server-time attempt.
 * - Re-checks on `visibilitychange` so a backgrounded tab snaps back when
 *   refocused.
 *
 * Sync precision is bounded by the writer/reader Date.now() skew, which for
 * NTP-synced modern devices is typically under 50 ms.
 */
export function RoomMusicSync() {
  const { audioRef, setRoomController } = useBackgroundMusic();
  const musicStartedAt = useStorage((root) => root.musicStartedAt);
  const { setMusicStartedAt } = useStorageMutations();

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (musicStartedAt == null) {
      el.pause();
      return;
    }

    let cancelled = false;

    const expectedPosition = (dur: number): number => {
      const elapsedSec = (Date.now() - musicStartedAt) / 1000;
      return ((elapsedSec % dur) + dur) % dur;
    };

    // Initial seek + play. If metadata isn't loaded yet (preload="metadata"
    // is set on the <audio>, so this is rare) just wait for it — never call
    // el.load(), which would tear down any in-progress playback.
    const startPlayback = () => {
      if (cancelled) return;
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur <= 0) {
        el.addEventListener("loadedmetadata", startPlayback, { once: true });
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

    // Threshold-based correction. Only fires while audio is actively playing
    // with known duration, and only seeks when drift is over the threshold.
    const correct = () => {
      if (cancelled || el.paused) return;
      const dur = el.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      const expected = expectedPosition(dur);
      let diff = expected - el.currentTime;
      // Loop-seam wraparound: pick the shorter distance around the loop.
      if (diff > dur / 2) diff -= dur;
      else if (diff < -dur / 2) diff += dur;
      if (Math.abs(diff) > DRIFT_THRESHOLD_S) {
        el.currentTime = expected;
      }
    };

    startPlayback();
    const intervalId = window.setInterval(correct, CORRECTION_INTERVAL_MS);
    const onVisibility = () => {
      if (!document.hidden) correct();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
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
