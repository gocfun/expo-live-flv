export const DEFAULT_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 8000] as const
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'reconnecting' | 'failed' | 'unsupported'
export type FailureReason = 'invalid-source' | 'native-unavailable' | 'native-error' | 'ended' | 'stalled'
export interface PlaybackState { status: PlaybackStatus; attempt: number; reason?: FailureReason }

export function isSecureLiveSource(source: unknown): source is string {
  if (typeof source !== 'string' || source.trim() !== source || !source) return false
  try {
    const url = new URL(source)
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password
  } catch { return false }
}
export function resolveAspectRatio(width?: number, height?: number, fallback = 16 / 9): number {
  return Number.isFinite(width) && Number.isFinite(height) && width! > 0 && height! > 0
    ? width! / height!
    : Number.isFinite(fallback) && fallback > 0 ? fallback : 16 / 9
}
export interface Clock {
  now(): number
  schedule(callback: () => void, delayMs: number): unknown
  cancel(handle: unknown): void
}
export interface ControllerOptions {
  clock: Clock
  retryDelaysMs?: readonly number[]
  stallTimeoutMs?: number
  healthyResetMs?: number
  onState(state: PlaybackState): void
  onRestart(generation: number): void
}

// Source-independent policy: never receives or logs URLs, tokens or native errors.
export class PlaybackController {
  private generation = -1
  private failures = 0
  private disposed = false
  private recovering = false
  private terminal = false
  private retryTimer: unknown = null
  private watchdog: unknown = null
  private lastProgress = 0
  private mediaTime: number | null = null
  private healthySince: number | null = null
  private healthyReset = false
  private status: PlaybackStatus = 'idle'
  private readonly delays: readonly number[]
  private readonly stallMs: number
  private readonly healthyMs: number
  constructor(private readonly options: ControllerOptions) {
    this.delays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS
    this.stallMs = options.stallTimeoutMs ?? 20000
    this.healthyMs = options.healthyResetMs ?? 30000
    if (!Number.isFinite(this.stallMs) || this.stallMs < 1000 ||
        !Number.isFinite(this.healthyMs) || this.healthyMs < 1000 ||
        this.delays.some(n => !Number.isFinite(n) || n < 0)) {
      throw new Error('Invalid playback timing policy')
    }
  }
  start(): void {
    if (this.disposed || this.generation !== -1) return
    this.restart()
  }
  private emit(status: PlaybackStatus, reason?: FailureReason): void {
    if (this.disposed) return
    this.status = status
    this.options.onState({ status, attempt: Math.max(0, this.generation), ...(reason ? { reason } : {}) })
  }
  private accepts(generation: number): boolean {
    return !this.disposed && !this.recovering && !this.terminal && generation === this.generation
  }
  playing(generation: number): void {
    if (this.accepts(generation) && this.status !== 'playing') this.emit('playing')
  }
  progress(timeMs: number, generation: number): void {
    if (!this.accepts(generation) || !Number.isFinite(timeMs) || timeMs < 0 || timeMs === this.mediaTime) return
    // Rebase after a timestamp discontinuity, but don't let backwards time
    // refresh the watchdog or count toward a sustained healthy period.
    if (this.mediaTime !== null && timeMs < this.mediaTime) {
      this.mediaTime = timeMs
      this.healthySince = null
      return
    }
    this.mediaTime = timeMs
    const now = this.options.clock.now()
    this.lastProgress = now
    if (this.healthySince === null) this.healthySince = now
    if (!this.healthyReset && now - this.healthySince >= this.healthyMs) {
      this.failures = 0
      this.healthyReset = true
    }
    this.playing(generation)
  }
  fail(reason: FailureReason, generation: number): void {
    if (!this.accepts(generation)) return
    this.recovering = true
    this.clearWatchdog()
    const delay = this.delays[this.failures++]
    if (delay === undefined) {
      this.terminal = true
      this.emit('failed', reason)
      return
    }
    this.emit('reconnecting', reason)
    this.retryTimer = this.options.clock.schedule(() => {
      this.retryTimer = null
      if (!this.disposed) this.restart()
    }, delay)
  }
  private restart(): void {
    this.recovering = false
    this.healthySince = null
    this.healthyReset = false
    this.mediaTime = null
    this.lastProgress = this.options.clock.now()
    this.generation++
    this.emit('loading')
    this.options.onRestart(this.generation)
    this.armWatchdog(this.stallMs)
  }
  private armWatchdog(delay: number): void {
    this.watchdog = this.options.clock.schedule(() => {
      this.watchdog = null
      if (this.disposed || this.recovering || this.terminal) return
      const remaining = this.stallMs - (this.options.clock.now() - this.lastProgress)
      if (remaining <= 0) this.fail('stalled', this.generation)
      else this.armWatchdog(remaining)
    }, delay)
  }
  private clearWatchdog(): void {
    if (this.watchdog !== null) this.options.clock.cancel(this.watchdog)
    this.watchdog = null
  }
  dispose(): void {
    this.disposed = true
    this.clearWatchdog()
    if (this.retryTimer !== null) this.options.clock.cancel(this.retryTimer)
    this.retryTimer = null
  }
}
