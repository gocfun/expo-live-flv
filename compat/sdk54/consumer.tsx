import React from 'react'
import { LiveFlvPlayer } from 'expo-live-flv'
import type { LiveFlvPlayerProps, LiveFlvPlayerRef } from 'expo-live-flv'
const props: LiveFlvPlayerProps = { source: null, active: true, playInBackground: true }
const ref = React.createRef<LiveFlvPlayerRef>()
export const consumer = <LiveFlvPlayer {...props} ref={ref} />
