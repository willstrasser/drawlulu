/**
 * Estimates the offset between the client clock and the server clock so all
 * players in a room can agree on a single wall time — independent of each
 * device's potentially-skewed `Date.now()`.
 *
 * Uses an NTP-style symmetric RTT estimate:
 *   t0 = client send
 *   t1 = server timestamp at handle time   (server only stamps once)
 *   t3 = client receive
 *   rtt = t3 - t0
 *   offset ≈ t1 - (t0 + t3) / 2     (assumes symmetric latency)
 *
 * We take several samples and keep the one with the smallest RTT — that's the
 * sample least disturbed by network jitter, so its offset is the tightest
 * estimate. In practice this lands the offset to within a few tens of ms,
 * which is well under the human-perceptible threshold for audio sync.
 */

const SAMPLE_COUNT = 5;

let cachedOffsetPromise: Promise<number> | null = null;

async function pingOnce(): Promise<{ rtt: number; offset: number }> {
  const t0 = Date.now();
  const res = await fetch("/api/time", { cache: "no-store" });
  const t3 = Date.now();
  const { t } = (await res.json()) as { t: number };
  return { rtt: t3 - t0, offset: t - (t0 + t3) / 2 };
}

async function computeOffset(): Promise<number> {
  const samples: { rtt: number; offset: number }[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    try {
      samples.push(await pingOnce());
    } catch {
      // network blip — keep trying the remaining samples
    }
  }
  if (samples.length === 0) return 0;
  samples.sort((a, b) => a.rtt - b.rtt);
  return samples[0]!.offset;
}

/**
 * Returns a cached promise that resolves to the client→server clock offset
 * in ms. Resolves once per page load; subsequent calls return the same value.
 */
export function getServerTimeOffset(): Promise<number> {
  if (!cachedOffsetPromise) cachedOffsetPromise = computeOffset();
  return cachedOffsetPromise;
}

export function serverNow(offset: number): number {
  return Date.now() + offset;
}
