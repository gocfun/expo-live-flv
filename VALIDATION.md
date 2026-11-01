# Validation

## Consumer playback confirmation — reported 2026-11-01

- The maintainer confirmed playback testing was already completed in
  `gocfun-mobile`. This is consumer integration testing in addition to the
  automated checks below.
- Tested device: **iPhone 12 Pro Max, iOS 26.7.2**, as reported by the maintainer.
- Tested revision, execution date and individual scenarios were not supplied
  in this confirmation. Record existing results in DEVICE_TESTING.md;
  they should not be described as globally untested or automatically extended to
  every scenario/platform or to the current unreleased watchdog fix.

## Open-source readiness checks — 2026-11-01

- Node 24.12.0 / pnpm 10.28.2: TypeScript build and 20/20 unit/mocked-component
  tests pass, including backwards/oscillating/reset timestamp regression cases.
- Packed package installed in an independent temporary Expo consumer (no link to
  library source). Consumer typecheck and default/opt-in config plugin introspection
  pass. Default plugin leaves background audio disabled; opt-in adds the iOS audio mode.
- Android/iOS Hermes and web Metro exports pass. Web source-map checks ensure
  the web adapter is selected and the upstream native VLC binding is excluded.
- Fixed the example entry point for pnpm isolated dependency layouts.
- This automated audit run did not compile or launch a native app or play a
  stream. Consumer playback was tested separately by the maintainer (see above). Native engine versions and
  previously recorded APK measurements are unchanged; those APKs were not rebuilt.
- Public repository created at `https://github.com/gocfun/expo-live-flv` and
  package metadata configured for it. npm name ownership and a private security
  reporting channel remain release setup items in RELEASING.md. No npm package
  or application deployment was published.

## Historical extraction baseline — 2026-10-31

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
- This historical extraction run did not include stream/device execution. Later
  consumer playback confirmation is recorded above; detailed scenario and
  performance measurements are tracked separately in DEVICE_TESTING.md.
- Native engine remains the existing expo-libvlc-player 4.0.5 dependency:
  MobileVLCKit 3.7.3 / Android LibVLC 3.6.5. iOS native binding compiled in the
  earlier consumer experiment; only the extracted JS bundle was revalidated here.
- Local Git only. No GitHub repo, npm publication, cloud build or backend change.
