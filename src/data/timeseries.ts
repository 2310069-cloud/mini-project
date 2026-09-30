import { makeRng, randInt, jitter } from '../lib/random'
import { DEMO_NOW } from './generator'
import type { TimeRange } from '../types'

const rng = makeRng(55291)

export interface TimelinePoint {
  time: string // display label
  ts: number
  normal: number
  authFailures: number
  bruteForce: number
  powershell: number
  portScan: number
  privEsc: number
}

const RANGE_CONFIG: Record<TimeRange, { points: number; stepMs: number; labelFmt: (d: Date) => string }> = {
  '15m': { points: 30, stepMs: 30_000, labelFmt: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) },
  '1h': { points: 30, stepMs: 2 * 60_000, labelFmt: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) },
  '24h': { points: 48, stepMs: 30 * 60_000, labelFmt: (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) },
  '7d': { points: 42, stepMs: 4 * 60 * 60_000, labelFmt: (d) => d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', hour12: false }) },
}

export function buildThreatTimeline(range: TimeRange): TimelinePoint[] {
  const cfg = RANGE_CONFIG[range]
  const pts: TimelinePoint[] = []
  const now = DEMO_NOW.getTime()

  for (let i = cfg.points - 1; i >= 0; i--) {
    const ts = now - i * cfg.stepMs
    const d = new Date(ts)
    const baseline = jitter(rng, 420, 0.25)

    // Inject the brute-force spike near "now" for 15m/1h ranges to match the
    // active incident narrative (attack ran ~8 min ago, resolved ~1 min ago)
    const minutesFromNow = (now - ts) / 60000
    const inBruteWindow = minutesFromNow >= 0.6 && minutesFromNow <= 9.5
    const inScanWindow = minutesFromNow >= 2.8 && minutesFromNow <= 4.2
    const inPsWindow = minutesFromNow >= 1.3 && minutesFromNow <= 2.4

    let bruteForce = 0
    let portScan = 0
    let powershell = 0
    let privEsc = 0
    let authFailures = randInt(rng, 2, 9)

    if (range === '15m' || range === '1h') {
      if (inBruteWindow) {
        bruteForce = randInt(rng, 14, 26)
        authFailures += randInt(rng, 8, 16)
      }
      if (inScanWindow) portScan = randInt(rng, 10, 20)
      if (inPsWindow) {
        powershell = randInt(rng, 1, 2)
        privEsc = randInt(rng, 0, 1)
      }
    } else {
      // For longer ranges, show smaller ambient spikes across history plus one
      // notable historic incident echo for MALWARE (~87m ago) and general noise.
      bruteForce = rng() > 0.92 ? randInt(rng, 3, 12) : 0
      portScan = rng() > 0.88 ? randInt(rng, 2, 9) : 0
      powershell = rng() > 0.94 ? randInt(rng, 1, 3) : 0
      privEsc = rng() > 0.96 ? 1 : 0
      if (range === '24h' && minutesFromNow >= 5 && minutesFromNow <= 12) {
        bruteForce = randInt(rng, 10, 22)
      }
    }

    pts.push({
      time: cfg.labelFmt(d),
      ts,
      normal: Math.round(baseline),
      authFailures,
      bruteForce,
      powershell,
      portScan,
      privEsc,
    })
  }
  return pts
}

export interface AuthChartPoint {
  time: string
  success: number
  failure: number
}

export function buildAuthChart(range: TimeRange): AuthChartPoint[] {
  const cfg = RANGE_CONFIG[range]
  const now = DEMO_NOW.getTime()
  const pts: AuthChartPoint[] = []
  for (let i = cfg.points - 1; i >= 0; i--) {
    const ts = now - i * cfg.stepMs
    const minutesFromNow = (now - ts) / 60000
    const inBruteWindow = minutesFromNow >= 0.6 && minutesFromNow <= 9.5
    const success = randInt(rng, 6, 18)
    let failure = randInt(rng, 1, 5)
    if ((range === '15m' || range === '1h') && inBruteWindow) {
      failure += randInt(rng, 16, 28)
    }
    pts.push({ time: cfg.labelFmt(new Date(ts)), success, failure })
  }
  return pts
}

export interface NetworkChartPoint {
  time: string
  inbound: number
  outbound: number
  blocked: number
}

export function buildNetworkChart(range: TimeRange): NetworkChartPoint[] {
  const cfg = RANGE_CONFIG[range]
  const now = DEMO_NOW.getTime()
  const pts: NetworkChartPoint[] = []
  for (let i = cfg.points - 1; i >= 0; i--) {
    const ts = now - i * cfg.stepMs
    const inbound = jitter(rng, 62, 0.3)
    const outbound = jitter(rng, 38, 0.3)
    const minutesFromNow = (now - ts) / 60000
    let blocked = randInt(rng, 0, 3)
    if ((range === '15m' || range === '1h') && minutesFromNow >= 2.8 && minutesFromNow <= 4.2) {
      blocked += randInt(rng, 8, 16)
    }
    pts.push({ time: cfg.labelFmt(new Date(ts)), inbound: Math.round(inbound), outbound: Math.round(outbound), blocked })
  }
  return pts
}
