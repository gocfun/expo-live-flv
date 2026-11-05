import React from 'react'
import { LiveFlvPlayer } from '@gocfun/expo-live-flv'
import type { LiveFlvPlayerProps, LiveFlvPlayerRef } from '@gocfun/expo-live-flv'
const props: LiveFlvPlayerProps = { source: null, active: true, playInBackground: true }
const ref = React.createRef<LiveFlvPlayerRef>()
export const consumer = <LiveFlvPlayer {...props} ref={ref} />
