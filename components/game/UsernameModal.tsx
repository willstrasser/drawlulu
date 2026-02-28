"use client";

import { useState } from "react";

type UsernameModalProps = {
  onComplete: (username: string) => void;
};

export function UsernameModal({ onComplete }: UsernameModalProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to set username");
      onComplete(data.username);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white/90 border-2 border-gray-900/10 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">
          What should we call you?
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Pick a name to show other players.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            maxLength={32}
            autoFocus
            className="bg-white/80 border-2 border-gray-900/10 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-riso-teal/50 text-center text-lg font-medium"
          />
          {error && (
            <p className="text-riso-red text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={!username.trim() || loading}
            className="w-full px-6 py-3 bg-riso-teal text-white border-2 border-gray-900 rounded-xl font-bold text-lg shadow-[4px_4px_0_var(--color-gray-900)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-gray-900)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Joining..." : "Let's Play!"}
          </button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-4">
          Or{" "}
          <a
            href="/api/auth/google"
            className="text-riso-teal underline underline-offset-2 hover:opacity-80"
          >
            sign in with Google
          </a>{" "}
          to save your stats.
        </p>
      </div>
    </div>
  );
}
