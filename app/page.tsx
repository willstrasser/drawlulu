"use client";

import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const { isSignedIn, user } = useUser();
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="border-b border-white/10 px-6 py-3 flex items-center justify-end">
        {isSignedIn ? (
          <UserButton />
        ) : (
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
              Sign In
            </button>
          </SignInButton>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-8 gap-12">
        <div className="text-center">
          <h2 className="text-9xl font-bold mb-4">
            Draw<span className="text-green-400">lulu</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-md">
            Write clever prompts, generate AI images, and guess what your
            friends were trying to draw. Like Taboo meets AI art!
          </p>
        </div>

        {isSignedIn ? (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-8 py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-xl font-bold text-lg transition-colors"
            >
              {creating ? "Creating..." : "Create Game"}
            </button>

            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter room code"
                maxLength={6}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 font-mono text-center tracking-widest uppercase"
              />
              <button
                onClick={handleJoin}
                disabled={joining || !joinCode.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
              >
                {joining ? "..." : "Join"}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-lg transition-colors">
                Sign In to Play
              </button>
            </SignInButton>
          </div>
        )}
      </main>
    </div>
  );
}
