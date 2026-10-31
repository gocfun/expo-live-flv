# Validation — 2026-10-31

- Standalone repo: pnpm install --frozen-lockfile --ignore-scripts; pnpm test:
  TypeScript build and 16/16 unit/mocked-component tests pass.
- Standalone example: independent pnpm install, typecheck and Expo prebuild config
  evaluation pass. The demo native app has not been built/launched on a device.
- GocFun consumer adapter: TypeScript and existing 45/45 tests pass; iOS/Hermes
  bundle export passes after extraction. Navigation and styling remain app-owned.
- Android consumer snapshot: both release arm64 builds pass with R8/shrink. Both
  embed identical JS; native VLC is absent from the control; certificates match.
  See benchmarks/ for size, SHA-256 and alignment evidence.
- The native-size measurement used a fixed alpha.1 consumer snapshot. After the
  measurement, alpha.2 added opt-in vlcOptions to preserve consumer-specific flags
  found in the installed GocFun package. The engine/binding versions are unchanged;
  this report does not claim byte-exact final alpha.2 APK size.
- No custom/slim VLC build has been attempted in this phase.
- No stream/device run: actual TLS, playback, network switching, lifecycle effects,
  latency, CPU, RAM, battery and release distribution compliance remain to verify.
- Native engine remains the existing expo-libvlc-player 4.0.5 dependency:
  MobileVLCKit 3.7.3 / Android LibVLC 3.6.5. iOS native binding compiled in the
  earlier consumer experiment; only the extracted JS bundle was revalidated here.
- Local Git only. No GitHub repo, npm publication, cloud build or backend change.
