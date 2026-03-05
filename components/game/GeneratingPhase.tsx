"use client";

import { motion } from "motion/react";

export function GeneratingPhase() {
  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        className="h-12 w-12 border-4 border-riso-teal border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
      <h2 className="text-2xl font-bold text-gray-900">Generating Images...</h2>
      <p className="text-gray-600">
        AI is creating images from everyone&apos;s prompts. This may take a few
        seconds.
      </p>
    </div>
  );
}
