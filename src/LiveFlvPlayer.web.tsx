import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { View } from 'react-native'
import type { LiveFlvPlayerProps, LiveFlvPlayerRef } from './types'
import type { PlaybackState } from './core'
const state: PlaybackState = { status: 'unsupported', attempt: 0, reason: 'native-unavailable' }
const LiveFlvPlayer = forwardRef<LiveFlvPlayerRef, LiveFlvPlayerProps>((props, ref) => {
  const latest = useRef(props); latest.current = props
  useImperativeHandle(ref, () => ({ retry: () => {} }), [])
  useEffect(() => { latest.current.onStatusChange?.(state) }, [])
  return <View style={props.style}>{props.renderOverlay?.(state, () => {})}</View>
})
export default LiveFlvPlayer
