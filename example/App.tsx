import React, { useState } from 'react'
import { Button, SafeAreaView, Text, TextInput, View } from 'react-native'
import { LiveFlvPlayer } from '@gocfun/expo-live-flv'
import type { PlaybackState } from '@gocfun/expo-live-flv'

export default function App() {
  const [input, setInput] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [paused, setPaused] = useState(false)
  const [playInBackground, setPlayInBackground] = useState(false)
  const [state, setState] = useState<PlaybackState>({ status: 'idle', attempt: 0 })
  return <SafeAreaView style={{ flex: 1, padding: 16 }}>
    <Text>Native HTTP-FLV example — supply your own authorized HTTPS stream</Text>
    <TextInput value={input} onChangeText={setInput} autoCapitalize="none" autoCorrect={false}
      placeholder="https://your-server.example/live/test.flv" accessibilityLabel="HTTPS stream URL" />
    <Button title="Connect" onPress={() => setSource(input.trim() || null)} />
    <LiveFlvPlayer source={source} paused={paused} muted={muted} playInBackground={playInBackground}
      style={{ width: '100%', aspectRatio: 16 / 9 }} onStatusChange={setState}
      renderOverlay={(current, retry) => current.status === 'failed'
        ? <Button title="Retry" onPress={retry} /> : null} />
    <Text>{state.status} / attempt {state.attempt}</Text>
    <View>
      <Button title={muted ? 'Unmute' : 'Mute'} onPress={() => setMuted(!muted)} />
      <Button title={paused ? 'Resume live' : 'Pause'} onPress={() => setPaused(!paused)} />
      <Button title={playInBackground ? 'Background audio: on' : 'Background audio: off'}
        onPress={() => setPlayInBackground(!playInBackground)} />
      <Button title="Disconnect" onPress={() => setSource(null)} />
    </View>
  </SafeAreaView>
}
