"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createGameAction,
  joinGameAction,
  initialActionState,
} from "@/app/actions/games";
import {
  signInAsGuest,
  signOut,
  initialGuestSignupState,
} from "@/app/actions/auth";
import { StampButton } from "@/components/ui/StampButton";
import type { SessionData } from "@/lib/session";

type HomeActionsProps = {
  user: SessionData | null;
};

export function HomeActions({ user }: HomeActionsProps) {
  return user ? <SignedIn user={user} /> : <SignedOut />;
}

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <StampButton
      type="submit"
      variant="teal"
      size="lg"
      disabled={pending}
      className="w-full"
    >
      {pending ? "Creating..." : "Create Game"}
    </StampButton>
  );
}

function JoinButton() {
  const { pending } = useFormStatus();
  return (
    <StampButton
      type="submit"
      variant="purple"
      size="md"
      disabled={pending}
      className="px-6 py-3"
    >
      {pending ? "..." : "Join"}
    </StampButton>
  );
}

function GuestSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <StampButton
      type="submit"
      variant="teal"
      size="lg"
      disabled={pending}
      className="w-full"
    >
      {pending ? "Joining..." : "Let's Play!"}
    </StampButton>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="px-3 py-1.5 text-sm border border-gray-900/10 rounded-lg hover:bg-gray-900/5 transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}

function SignedIn({ user }: { user: SessionData }) {
  const [createState, createFormAction] = useActionState(
    createGameAction,
    initialActionState,
  );
  const [joinState, joinFormAction] = useActionState(
    joinGameAction,
    initialActionState,
  );

  const error = createState.error ?? joinState.error;

  return (
    <>
      <nav className="border-b border-gray-900/10 px-6 py-3 flex items-center justify-end gap-3">
        <span className="text-sm text-gray-600">{user.username}</span>
        <SignOutButton />
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 gap-8 sm:gap-12">
        <Hero />
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          <form action={createFormAction} className="w-full">
            <CreateButton />
          </form>

          <Divider />

          <form action={joinFormAction} className="flex gap-2 w-full">
            <input
              type="text"
              name="code"
              placeholder="Enter room code"
              maxLength={6}
              required
              className="flex-1 bg-white/60 border-2 border-gray-900/10 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-riso-teal/50 font-mono text-center tracking-widest uppercase"
            />
            <JoinButton />
          </form>

          {error && (
            <p className="text-riso-red text-sm text-center">{error}</p>
          )}
        </div>
      </main>
    </>
  );
}

function SignedOut() {
  const [state, formAction] = useActionState(
    signInAsGuest,
    initialGuestSignupState,
  );

  return (
    <>
      <nav className="border-b border-gray-900/10 px-6 py-3 flex items-center justify-end gap-3">
        <a
          href="/api/auth/google"
          className="px-4 py-2 bg-white/60 hover:bg-white/80 border-2 border-gray-900/10 rounded-lg text-sm font-medium transition-colors"
        >
          Sign in with Google
        </a>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 gap-8 sm:gap-12">
        <Hero />
        <form
          action={formAction}
          className="flex flex-col items-center gap-4 w-full max-w-sm"
        >
          <input
            type="text"
            name="username"
            placeholder="Pick a name to play"
            maxLength={32}
            required
            autoFocus
            className="w-full bg-white/60 border-2 border-gray-900/10 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-riso-teal/50 text-center text-lg font-medium"
          />
          {state.error && (
            <p className="text-riso-red text-sm">{state.error}</p>
          )}
          <GuestSubmitButton />
          <p className="text-xs text-gray-400 text-center">
            Or use the Google sign-in above to save your stats.
          </p>
        </form>
      </main>
    </>
  );
}

function Hero() {
  return (
    <div className="text-center">
      <h2 className="text-5xl sm:text-9xl font-bold mb-4">
        Draw<span className="text-riso-teal">lulu</span>
      </h2>
      <p className="text-gray-600 text-lg max-w-md">
        Write clever prompts, generate AI images, and guess what your friends
        were trying to draw. Like Taboo meets AI art!
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-px bg-gray-900/10" />
      <span className="text-gray-500 text-sm">or</span>
      <div className="flex-1 h-px bg-gray-900/10" />
    </div>
  );
}
