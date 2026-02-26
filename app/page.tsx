"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/games", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/game/${data.roomCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create game");
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setError("");
    try {
      const res = await fetch(`/api/games/${joinCode.toUpperCase()}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/game/${data.roomCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join game");
      setJoining(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen text-gray-900 flex flex-col">
      <nav className="border-b border-gray-900/10 px-6 py-3 flex items-center justify-end">
        {isSignedIn ? (
          <UserButton />
        ) : (
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-white/60 hover:bg-white/80 border-2 border-gray-900/10 rounded-lg text-sm font-medium transition-colors">
              Sign In
            </button>
          </SignInButton>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-8 gap-12">
        <div className="text-center">
          <h2 className="text-9xl font-bold mb-4">
            Draw<span className="text-riso-teal">lulu</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-md">
            Write clever prompts, generate AI images, and guess what your
            friends were trying to draw. Like Taboo meets AI art!
          </p>
        </div>

        {isSignedIn ? (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-8 py-4 bg-riso-teal text-white border-2 border-gray-900 rounded-xl font-bold text-lg shadow-[4px_4px_0_var(--color-gray-900)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-gray-900)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 transition-all"
            >
              {creating ? "Creating..." : "Create Game"}
            </button>

            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-gray-900/10" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-900/10" />
            </div>

            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter room code"
                maxLength={6}
                className="flex-1 bg-white/60 border-2 border-gray-900/10 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-riso-teal/50 font-mono text-center tracking-widest uppercase"
              />
              <button
                onClick={handleJoin}
                disabled={joining || !joinCode.trim()}
                className="px-6 py-3 bg-riso-purple text-white border-2 border-gray-900 rounded-lg font-bold shadow-[4px_4px_0_var(--color-gray-900)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-gray-900)] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed transition-all"
              >
                {joining ? "..." : "Join"}
              </button>
            </div>

            {error && (
              <p className="text-riso-red text-sm text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-riso-teal text-white border-2 border-gray-900 rounded-xl font-bold text-lg shadow-[4px_4px_0_var(--color-gray-900)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--color-gray-900)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                Sign In to Play
              </button>
            </SignInButton>
          </div>
        )}
      </main>
    </div>
  );
}
