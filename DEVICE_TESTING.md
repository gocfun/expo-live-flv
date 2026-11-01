# Device playback validation

Status: **consumer playback tested in `gocfun-mobile`, confirmed by the maintainer
on 2026-11-01**. Tested device: **iPhone 12 Pro Max, iOS 26.7.2**
(as reported by the maintainer). The confirmation date is not the test execution
date. Build version and scenario-level results have not yet been recorded here.

The matrix below tracks documentation coverage: **Not recorded** does not mean
not tested. Populate it from the existing consumer test results; rerun only cases
that were not covered or are affected by subsequent changes. The watchdog fix in
the current unreleased changes has automated regression coverage; device coverage
of that exact revision has not been established.

Unit tests, Metro bundles and native builds are recorded separately from playback
results. A standalone example run provides an additional integration check; it is
not a prerequisite for recognizing the completed consumer playback tests.

Use `gocfun-mobile` or the standalone example with an authorized stream you control.
Never commit signed URLs, tokens, private endpoints or unredacted native logs.
Test release builds as well as development builds. Record the package commit,
Expo/RN/binding versions, device model, OS, architecture, build type, codec,
resolution, stream configuration and network conditions. Tests for iOS background
audio require the opt-in plugin configuration and a native rebuild.

| Scenario | Expected observation | Android | iOS |
|---|---|---|---|
| HTTPS FLV, landscape and portrait | Picture/audio present; contain/cover and rotation resize correctly | Not recorded | Not recorded |
| Continuous playback for 30+ minutes | No progressive drift, unexpected restart or unbounded RAM/connection growth | Not recorded | Not recorded |
| Disconnect network, then restore | Bounded backoff; successful recovery or terminal failure; manual retry works | Not recorded | Not recorded |
| Switch Wi-Fi/mobile network | Recovery without duplicate audio or persistent old connections | Not recorded | Not recorded |
| Expired token, invalid TLS, unavailable server | Stable failure codes; bounded retries; no URL/token exposure in wrapper callbacks | Not recorded | Not recorded |
| Replace source while playing/reconnecting | Old connection stops; new source plays; old events cannot change current state | Not recorded | Not recorded |
| Pause/resume and navigation blur/focus | Native resources release; resume opens a fresh live connection | Not recorded | Not recorded |
| Background/foreground and lock/unlock, default policy | Playback stops; foreground reconnects | Not recorded | Not recorded |
| Opt-in background playback and lock for 5+ minutes | Record actual audio continuity, watchdog behavior and OS restrictions | Not recorded | Not recorded |
| Repeated mount/unmount/retry, 50 cycles | No overlapping audio or sustained growth in decoders, sockets or RAM | Not recorded | Not recorded |
| Mute/unmute and audio interruption | Correct volume; record phone/headphone/audio-focus behavior | Not recorded | Not recorded |
| Android 16 KB page-size device/emulator | Install and playback work; alignment checks alone are insufficient | Not recorded | N/A |

For each run, attach a dated result with observed status transitions, retry count,
duration and any reproduction steps. Measure CPU/RAM/thermal behavior under a
fixed stream; report measurements rather than claiming a universal threshold.
Use redacted server connection counts or platform profiling tools to verify
native resource release; JS unmount counts alone are insufficient.

Background playback coverage should be recorded from the consumer tests before
claiming support for specific devices or OS versions. Android has no foreground playback service in this wrapper. A failed
background test must be documented as a limitation, not hidden by increasing
timeouts. No latency claim is justified without a controlled end-to-end clock.
