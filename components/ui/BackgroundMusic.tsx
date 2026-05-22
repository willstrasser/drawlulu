"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

const TRACK_URL =
  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bossa%20Antigua.mp3";
const STORAGE_KEY = "drawlulu:bg-music";
const VOLUME = 0.25;

type RoomController = {
  /** True if music is playing room-wide (driven by Liveblocks storage). */
  playing: boolean;
  /** Called when the user clicks the toggle while inside a room. */
  toggle: () => void;
};

type MusicCtx = {
  audioRef: RefObject<HTMLAudioElement | null>;
  /** Local playback state (used when no room controller is active). */
  localPlaying: boolean;
  setLocalPlaying: (next: boolean) => void;
  roomController: RoomController | null;
  setRoomController: (c: RoomController | null) => void;
};

const Ctx = createContext<MusicCtx | null>(null);

export function useBackgroundMusic(): MusicCtx {
  const v = useContext(Ctx);
  if (!v)
    throw new Error("useBackgroundMusic must be used inside <BackgroundMusic>");
  return v;
}

/**
 * Mounts the global audio element + toggle button. The audio element is
 * persistent across navigations (lives in the root layout), so entering and
 * leaving a game doesn't restart the track.
 *
 * Inside a Liveblocks room, RoomMusicSync registers a controller that takes
 * over the toggle so play/pause is shared across all players in the room.
 * Outside a room, the toggle is a purely local preference.
 */
export function BackgroundMusic({ children }: { children?: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localPlaying, setLocalPlaying] = useState(false);
  const [roomController, setRoomController] = useState<RoomController | null>(
    null,
  );

  // Restore the user's last local preference on mount. Autoplay is still
  // gated by a user gesture — if "on" but the browser blocks play(), we
  // resume on the next click anywhere.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) !== "on") return;
    const el = audioRef.current;
    if (!el) return;
    el.play()
      .then(() => setLocalPlaying(true))
      .catch(() => {
        const resume = () => {
          el.play()
            .then(() => setLocalPlaying(true))
            .catch(() => {});
        };
        window.addEventListener("pointerdown", resume, { once: true });
      });
  }, []);

  const playing = roomController ? roomController.playing : localPlaying;

  const handleClick = useCallback(() => {
    if (roomController) {
      roomController.toggle();
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    if (localPlaying) {
      el.pause();
      setLocalPlaying(false);
      window.localStorage.setItem(STORAGE_KEY, "off");
    } else {
      el.play()
        .then(() => {
          setLocalPlaying(true);
          window.localStorage.setItem(STORAGE_KEY, "on");
        })
        .catch(() => {});
    }
  }, [roomController, localPlaying]);

  return (
    <Ctx.Provider
      value={{
        audioRef,
        localPlaying,
        setLocalPlaying,
        roomController,
        setRoomController,
      }}
    >
      <audio
        ref={audioRef}
        src={TRACK_URL}
        loop
        preload="none"
        onPlay={() => setLocalPlaying(true)}
        onPause={() => setLocalPlaying(false)}
        onVolumeChange={(e) => {
          if (e.currentTarget.volume !== VOLUME) {
            e.currentTarget.volume = VOLUME;
          }
        }}
        onLoadedMetadata={(e) => {
          e.currentTarget.volume = VOLUME;
        }}
      />
      <button
        type="button"
        onClick={handleClick}
        aria-label={playing ? "Mute background music" : "Play background music"}
        aria-pressed={playing}
        className="fixed bottom-4 left-4 z-40 h-9 w-9 rounded-full bg-surface/70 backdrop-blur-sm border-2 border-border/10 text-foreground hover:bg-surface transition-colors flex items-center justify-center"
      >
        {playing ? <SpeakerOn /> : <SpeakerOff />}
      </button>
      {children}
    </Ctx.Provider>
  );
}

function SpeakerOn() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerOff() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}
