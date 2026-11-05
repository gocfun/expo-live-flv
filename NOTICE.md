# Third-party dependencies

This repository implements an app-independent playback policy and UI adapter.
It calls, but does not vendor or relicense, expo-libvlc-player or VideoLAN binaries.

- expo-libvlc-player 4.0.5 — MIT; author David Cornejo.
  https://github.com/cornejobarraza/expo-libvlc-player
- Android engine: org.videolan.android:libvlc-all:3.6.5.
- iOS engine: MobileVLCKit 3.7.3. VLCKit and LibVLC are LGPL 2.1 (see the exact artifacts' licenses).
  https://code.videolan.org/videolan/VLCKit
  https://www.videolan.org/vlc/libvlc.html

The MIT license here only covers this repository's own code. Applications must
inventory their actual binary/codec dependencies and comply with their notices,
corresponding-source and replacement/relinking requirements as applicable.
This release preparation does not constitute completed license clearance for App Store / Play distribution.
No upstream native binary is included in this Git repository or npm tarball.
