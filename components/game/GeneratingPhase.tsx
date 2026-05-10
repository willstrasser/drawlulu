"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { PhaseShell } from "@/components/ui/PhaseShell";

type GeneratingPhaseProps = {
  isHost: boolean;
  onSkip: () => void;
};

export function GeneratingPhase({ isHost, onSkip }: GeneratingPhaseProps) {
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (!isHost) return;
    const t = setTimeout(() => setShowSkip(true), 35_000);
    return () => clearTimeout(t);
  }, [isHost]);

  return (
    <PhaseShell width="full" density="comfortable">
      <motion.div
        className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
      <h2 className="text-2xl font-bold text-foreground">
        Generating Images...
      </h2>
      <p className="text-gray-600">
        AI is creating images from everyone&apos;s prompts. This may take a few
        seconds.
      </p>
      {showSkip && (
        <button
          onClick={onSkip}
          className="mt-2 text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          Skip to guessing →
        </button>
      )}
    </PhaseShell>
  );
}
