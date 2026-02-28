"use client";

import { useState } from "react";
import { useStorage, useOthers, useSelf } from "@/liveblocks.config";
import { PHASE } from "@/liveblocks.config";
import type { GamePhase } from "@/liveblocks.config";
import type { PromptEntry } from "@/lib/game-types";

type DevPanelProps = {
  code: string;
  prompts: PromptEntry[] | null;
  onExpireTimer: () => void;
  onSetPhase: (phase: GamePhase) => void;
};

const PHASES = Object.values(PHASE);

export function DevPanel({
  code,
  prompts,
  onExpireTimer,
  onSetPhase,
}: DevPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const self = useSelf();
  const others = useOthers();
  const gamePhase = useStorage((root) => root.gamePhase);
  const hostId = useStorage((root) => root.hostId);
  const currentPromptIndex = useStorage((root) => root.currentPromptIndex);
  const timerEndsAt = useStorage((root) => root.timerEndsAt);
  const selectedCategory = useStorage((root) => root.selectedCategory);
  const currentGuesses = useStorage((root) => root.currentGuesses);

  const isHost = self?.id === hostId;
  const timerActive =
    timerEndsAt !== null && timerEndsAt > new Date().getTime();

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-16 left-2 z-50 bg-yellow-600 text-black text-xs font-bold px-2 py-1 rounded shadow-lg hover:bg-yellow-500"
      >
        DEV
      </button>
    );
  }

  return (
    <div className="fixed top-16 left-2 z-50 w-64 bg-gray-900 border border-yellow-600/50 rounded-lg shadow-2xl text-xs text-gray-300 overflow-hidden">
      <div className="flex items-center justify-between bg-yellow-600 text-black px-2 py-1 font-bold">
        <span>DEV PANEL</span>
        <button onClick={() => setCollapsed(true)} className="hover:opacity-70">
          &times;
        </button>
      </div>

      <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
        {/* State */}
        <Section title="State">
          <Row label="Phase" value={gamePhase ?? "—"} />
          <Row label="Room" value={code} />
          <Row label="Category" value={selectedCategory || "none"} />
          <Row label="Host?" value={isHost ? "YES" : "no"} />
          <Row label="Host ID" value={hostId || "—"} />
          <Row label="My ID" value={self?.id || "—"} />
          <Row label="Players" value={String(others.length + 1)} />
          <Row label="Prompt Idx" value={String(currentPromptIndex ?? 0)} />
          <Row label="Prompts #" value={String(prompts?.length ?? 0)} />
          <Row label="Guesses #" value={String(currentGuesses?.length ?? 0)} />
          <Row
            label="Timer"
            value={
              timerActive
                ? `${Math.ceil((timerEndsAt! - new Date().getTime()) / 1000)}s`
                : "off"
            }
          />
        </Section>

        {/* Presence */}
        <Section title="Presence">
          {self && (
            <Row
              label="me"
              value={`${self.presence.hasSubmittedPrompt ? "submitted" : "pending"}`}
            />
          )}
          {others.map((o) => (
            <Row
              key={o.id}
              label={o.presence.username || String(o.id).slice(0, 8)}
              value={`${o.presence.hasSubmittedPrompt ? "submitted" : "pending"}`}
            />
          ))}
        </Section>

        {/* Actions */}
        <Section title="Actions">
          <button
            onClick={onExpireTimer}
            disabled={!timerActive}
            className="w-full px-2 py-1.5 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 rounded text-xs font-medium transition-colors"
          >
            Expire Timer (skip phase)
          </button>
          <div className="flex flex-wrap gap-1 mt-1">
            {PHASES.map((p) => (
              <button
                key={p}
                onClick={() => onSetPhase(p)}
                disabled={gamePhase === p}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  gamePhase === p
                    ? "bg-green-700 text-white"
                    : "bg-white/10 hover:bg-white/20 text-gray-400"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-yellow-500 font-bold mb-1">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-200 font-mono truncate max-w-30">{value}</span>
    </div>
  );
}
