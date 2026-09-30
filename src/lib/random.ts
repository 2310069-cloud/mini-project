// Deterministic pseudo-random generator so mock telemetry is stable across
// reloads (important for a demo — numbers shouldn't jump around on refresh).
export function makeRng(seed: number) {
  let s = seed >>> 0
  return function rng() {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

export function pickWeighted<T>(rng: () => number, items: [T, number][]): T {
  const total = items.reduce((a, [, w]) => a + w, 0)
  let r = rng() * total
  for (const [item, w] of items) {
    if (r < w) return item
    r -= w
  }
  return items[items.length - 1][0]
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function randFloat(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min
}

export function jitter(rng: () => number, base: number, pct: number): number {
  return base * (1 + (rng() * 2 - 1) * pct)
}
