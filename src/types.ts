import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import type { PlaybackState } from './core'
export interface LiveFlvPlayerRef { retry(): void }
export interface LiveFlvPlayerProps {
  source: string | null
  /** Set false when a navigation screen loses focus. App background is handled internally. */
  active?: boolean
  paused?: boolean
  muted?: boolean
  contentFit?: 'contain' | 'cover'
  style?: StyleProp<ViewStyle>
  /** Extra engine options for app-specific tuning; never logged by this wrapper. */
  vlcOptions?: readonly string[]
  networkCachingMs?: number
  retryDelaysMs?: readonly number[]
  stallTimeoutMs?: number
  healthyResetMs?: number
  progressIntervalMs?: number
  onStatusChange?(state: PlaybackState): void
  onVideoSize?(size: { width: number; height: number }): void
  onProgress?(progress: { timeSeconds: number }): void
  renderOverlay?(state: PlaybackState, retry: () => void): ReactNode
}
