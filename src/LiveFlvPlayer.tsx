import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { AppState, View } from 'react-native'
import { requireOptionalNativeModule } from 'expo'
import type { LibVlcPlayerViewProps } from 'expo-libvlc-player'
import { isSecureLiveSource, PlaybackController, resolveAspectRatio } from './core'
import type { PlaybackState } from './core'
import type { LiveFlvPlayerProps, LiveFlvPlayerRef } from './types'

function loadNativeView(): React.ComponentType<LibVlcPlayerViewProps> | null {
  // The upstream entry point requires a native view eagerly; don't evaluate it
  // in Expo Go or an old binary where the module doesn't exist.
  return requireOptionalNativeModule('ExpoLibVlcPlayer')
    ? require('expo-libvlc-player').LibVlcPlayerView
    : null
}
const LiveFlvPlayer = forwardRef<LiveFlvPlayerRef, LiveFlvPlayerProps>((props, ref) => {
  const [NativePlayer] = useState(loadNativeView)
  const [appState, setAppState] = useState(AppState.currentState)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [nonce, setNonce] = useState(0)
  const [state, setState] = useState<PlaybackState>({ status: 'idle', attempt: 0 })
  const latest = useRef(props); latest.current = props
  const retry = () => setNonce(n => n + 1)
  useImperativeHandle(ref, () => ({ retry }), [])
  useEffect(() => {
    const listener = AppState.addEventListener('change', setAppState)
    return () => listener.remove()
  }, [])
  const active = props.active !== false && !props.paused && (props.playInBackground ? true : appState === 'active')
  const valid = isSecureLiveSource(props.source)
  const eligible = active && valid && !!NativePlayer
  const inactiveState: PlaybackState = !active || !props.source ? { status: 'idle', attempt: 0 }
    : !valid ? { status: 'failed', attempt: 0, reason: 'invalid-source' }
    : !NativePlayer ? { status: 'unsupported', attempt: 0, reason: 'native-unavailable' }
    : state
  const displayed = eligible ? state : inactiveState
  useEffect(() => {
    latest.current.onStatusChange?.(displayed)
  }, [displayed.status, displayed.attempt, displayed.reason])
  // Timing option changes create a clean session rather than retaining old timers.
  const sessionKey = JSON.stringify([props.source, nonce, props.retryDelaysMs,
    props.stallTimeoutMs, props.healthyResetMs, props.networkCachingMs, props.vlcOptions, props.playInBackground])
  return <View style={props.style} onLayout={({ nativeEvent: { layout } }) => {
    if (layout.width > 0 && layout.height > 0) setSize(old =>
      Math.abs(old.width - layout.width) < 1 && Math.abs(old.height - layout.height) < 1
        ? old : { width: layout.width, height: layout.height })
  }}>
    {eligible && <Session key={sessionKey} {...props} source={props.source!}
      NativePlayer={NativePlayer!} size={size} onState={setState} />}
    {props.renderOverlay?.(displayed, retry)}
  </View>
})

function Session(props: LiveFlvPlayerProps & {
  source: string; NativePlayer: React.ComponentType<LibVlcPlayerViewProps>
  size: { width: number; height: number }; onState(state: PlaybackState): void
}) {
  const latest = useRef(props); latest.current = props
  const [generation, setGeneration] = useState<number | null>(null)
  const controller = useRef<PlaybackController | null>(null)
  useEffect(() => {
    const policy = new PlaybackController({
      clock: { now: Date.now, schedule: (cb, ms) => setTimeout(cb, ms),
        cancel: handle => clearTimeout(handle as ReturnType<typeof setTimeout>) },
      retryDelaysMs: props.retryDelaysMs,
      stallTimeoutMs: props.stallTimeoutMs,
      healthyResetMs: props.healthyResetMs,
      onState: state => {
        if (state.status === 'reconnecting' || state.status === 'failed') setGeneration(null)
        latest.current.onState(state)
      },
      onRestart: setGeneration,
    })
    controller.current = policy
    policy.start()
    return () => { policy.dispose(); controller.current = null }
  }, [])
  return generation === null ? null : <Attempt key={generation} {...props}
    generation={generation} controller={controller.current!} />
}
function Attempt(props: Parameters<typeof Session>[0] & { generation: number; controller: PlaybackController }) {
  const alive = useRef(true)
  const lastEmit = useRef<number | null>(null)
  const [videoRatio, setVideoRatio] = useState(16 / 9)
  const latest = useRef(props); latest.current = props
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const cache = Number.isFinite(props.networkCachingMs)
    ? Math.max(100, Math.min(10000, props.networkCachingMs!)) : 700
  const options = useMemo(() => [`--network-caching=${Math.round(cache)}`, `--live-caching=${Math.round(cache)}`, ...(props.vlcOptions ?? [])], [cache, props.vlcOptions])
  const fail = (reason: 'native-error' | 'ended') => {
    if (alive.current) props.controller.fail(reason, props.generation)
  }
  const NativePlayer = props.NativePlayer
  return <NativePlayer source={props.source} style={{ width: '100%', height: '100%' }}
    aspectRatio={resolveAspectRatio(props.size.width, props.size.height, videoRatio)}
    contentFit={props.contentFit ?? 'contain'} options={options} autoplay
    playInBackground={!!props.playInBackground} repeat={false} mute={!!props.muted} rate={1}
    onEncounteredError={() => fail('native-error')} onEndReached={() => fail('ended')}
    onPlaying={() => { if (alive.current) props.controller.playing(props.generation) }}
    onFirstPlay={({ width, height }) => {
      if (!alive.current || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return
      setVideoRatio(width / height)
      latest.current.onVideoSize?.({ width, height })
    }}
    onTimeChanged={({ time }) => {
      if (!alive.current || !Number.isFinite(time) || time < 0) return
      props.controller.progress(time, props.generation)
      const now = Date.now()
      const interval = Number.isFinite(props.progressIntervalMs) ? Math.max(100, props.progressIntervalMs!) : 500
      if (lastEmit.current === null || now - lastEmit.current >= interval) {
        lastEmit.current = now
        latest.current.onProgress?.({ timeSeconds: time / 1000 })
      }
    }} />
}
LiveFlvPlayer.displayName = 'LiveFlvPlayer'
export default LiveFlvPlayer
