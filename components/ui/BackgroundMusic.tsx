"use client";

import { useEffect, useRef, useState } from "react";

const TRACK_URL =
  "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bossa%20Antigua.mp3";
const STORAGE_KEY = "drawlulu:bg-music";
const VOLUME = 0.25;

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  // Restore the user's last preference on mount. Autoplay is still gated by
  // a user gesture — if the stored value is "on", we attempt play() but the
  // browser may reject it until the next click anywhere.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) !== "on") return;
    const el = audioRef.current;
    if (!el) return;
    el.play()
      .then(() => setPlaying(true))
      .catch(() => {
        // Autoplay blocked — wait for the next interaction.
        const resume = () => {
          el.play()
            .then(() => setPlaying(true))
            .catch(() => {});
          window.removeEventListener("pointerdown", resume);
        };
        window.addEventListener("pointerdown", resume, { once: true });
      });
  }, []);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      window.localStorage.setItem(STORAGE_KEY, "off");
    } else {
      el.play()
        .then(() => {
          setPlaying(true);
          window.localStorage.setItem(STORAGE_KEY, "on");
        })
        .catch(() => {});
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={TRACK_URL}
        loop
        preload="none"
        crossOrigin="anonymous"
        onVolumeChange={(e) => {
          // Pin the volume so external controls can't blast users.
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
        onClick={toggle}
        aria-label={playing ? "Mute background music" : "Play background music"}
        aria-pressed={playing}
        className="fixed bottom-4 left-4 z-40 h-9 w-9 rounded-full bg-surface/70 backdrop-blur-sm border-2 border-border/10 text-foreground hover:bg-surface transition-colors flex items-center justify-center"
      >
        {playing ? <SpeakerOn /> : <SpeakerOff />}
      </button>
    </>
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
