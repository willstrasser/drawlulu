"use client";

import { useOthers, useSelf } from "@/liveblocks.config";

export function PlayerList() {
  const others = useOthers();
  const self = useSelf();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        Players ({others.length + 1})
      </h3>
      <ul className="space-y-1">
        {self && (
          <li className="flex items-center gap-2 rounded-lg bg-white/60 backdrop-blur-sm border-2 border-gray-900/10 px-3 py-2">
            {self.info?.imageUrl && (
              <img
                src={self.info.imageUrl as string}
                alt=""
                className="h-6 w-6 rounded-full"
              />
            )}
            <span className="font-medium">
              {self.presence.username} (you)
            </span>
            {self.presence.isReady && (
              <span className="ml-auto text-riso-teal text-xs font-bold">Ready</span>
            )}
          </li>
        )}
        {others.map((other) => (
          <li
            key={other.connectionId}
            className="flex items-center gap-2 rounded-lg bg-white/60 backdrop-blur-sm border-2 border-gray-900/10 px-3 py-2"
          >
            {other.info?.imageUrl && (
              <img
                src={other.info.imageUrl as string}
                alt=""
                className="h-6 w-6 rounded-full"
              />
            )}
            <span>{other.presence.username}</span>
            {other.presence.isReady && (
              <span className="ml-auto text-riso-teal text-xs font-bold">Ready</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
