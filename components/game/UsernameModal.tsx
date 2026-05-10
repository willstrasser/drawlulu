"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { signInAsGuest, initialGuestSignupState } from "@/app/actions/auth";
import { StampButton } from "@/components/ui/StampButton";

const WOBBLE = { type: "spring", stiffness: 300, damping: 18 } as const;

type UsernameModalProps = {
  onComplete: (username: string) => void;
};

function SubmitButton() {
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

export function UsernameModal({ onComplete }: UsernameModalProps) {
  const [state, formAction] = useActionState(
    signInAsGuest,
    initialGuestSignupState,
  );

  useEffect(() => {
    if (state.ok && state.username) onComplete(state.username);
  }, [state, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative bg-white/90 border-2 border-gray-900/10 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4"
        initial={{ opacity: 0, scale: 0.88, y: 20, rotate: -1.5 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={WOBBLE}
      >
        <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">
          What should we call you?
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Pick a name to show other players.
        </p>
        <form action={formAction} className="flex flex-col gap-4">
          <input
            type="text"
            name="username"
            placeholder="Your name"
            maxLength={32}
            required
            autoFocus
            className="bg-white/80 border-2 border-gray-900/10 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-riso-teal/50 text-center text-lg font-medium"
          />
          {state.error && (
            <p className="text-riso-red text-sm text-center">{state.error}</p>
          )}
          <SubmitButton />
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
      </motion.div>
    </motion.div>
  );
}
