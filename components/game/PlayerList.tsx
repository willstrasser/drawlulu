"use client";

import { AnimatePresence, motion } from "motion/react";
import { useOthers, useSelf } from "@/liveblocks.config";
import Image from "next/image";

const ITEM_SPRING = { type: "spring", stiffness: 500, damping: 34 } as const;

export function PlayerList() {
  const others = useOthers();
  const self = useSelf();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        Players ({others.length + 1})
      </h3>
      <ul className="space-y-1">
        <AnimatePresence>
          {self && (
            <motion.li
              key="self"
              className="flex items-center gap-2 rounded-lg bg-surface/60 backdrop-blur-sm border-2 border-border/10 px-3 py-2"
              initial={{ opacity: 0, scale: 0.9, x: -12 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 12 }}
              transition={ITEM_SPRING}
            >
              {self.info?.imageUrl && (
                <Image
                  src={self.info.imageUrl as string}
                  alt=""
                  className="h-6 w-6 rounded-full"
                  width={24}
                  height={24}
                />
              )}
              <span className="font-medium">
                {self.presence.username} (you)
              </span>
              {self.presence.isReady && (
                <span className="ml-auto text-primary text-xs font-bold">
                  Ready
                </span>
              )}
            </motion.li>
          )}
          {others.map((other) => (
            <motion.li
              key={other.connectionId}
              className="flex items-center gap-2 rounded-lg bg-surface/60 backdrop-blur-sm border-2 border-border/10 px-3 py-2"
              initial={{ opacity: 0, scale: 0.9, x: -12 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 12 }}
              transition={ITEM_SPRING}
            >
              {other.info?.imageUrl && (
                <Image
                  src={other.info.imageUrl as string}
                  alt=""
                  className="h-6 w-6 rounded-full"
                  width={24}
                  height={24}
                />
              )}
              <span>{other.presence.username}</span>
              {other.presence.isReady && (
                <span className="ml-auto text-primary text-xs font-bold">
                  Ready
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
