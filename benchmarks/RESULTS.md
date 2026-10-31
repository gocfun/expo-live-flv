# Android arm64 release results — 2026-10-31

Measured on a GocFun Mobile consumer snapshot, using the same source, installed
dependency tree, embedded JS and debug signing certificate. Expo 54.0.37,
React Native 0.81.5, Hermes, New Architecture, VLC binding 4.0.5 / LibVLC 3.6.5.
R8 and resource shrinking enabled; native libraries remain uncompressed in APK.

| Variant | APK bytes | APK MiB | Native libraries |
|---|---:|---:|---:|
| Without native VLC autolinking | 55,995,640 | 53.40 | 24 |
| With native VLC autolinking | 99,373,369 | 94.77 | 26 |
| Difference | 43,377,729 | **41.37** | +2 |

Relative increase: **77.47%** over the no-VLC variant.
The two VLC .so files alone total 43,182,576 stored bytes
(41.18 MiB). The remaining APK difference is
195,153 bytes, aggregated across other
APK entries and packaging; it has not been fully attributed by subsystem.

JS bundle SHA-256 (identical in both):
`414c34b2c652eafd07ebb031a8ba6adf619603306f04ea8d5d7e7d8f365744c1`.
Native module discovery and APK contents confirm VLC presence only in the enabled
variant. APK signature verification confirms the same signing certificate.
All 26/24 arm64 native libraries passed ELF PT_LOAD and ZIP alignment checks for
16 KB. This is not an actual 16 KB device execution test.

These are raw release APK sizes for one ABI, not universal debug APK sizes,
Google Play AAB delivery sizes, historical store-app sizes, iOS IPA sizes or
measurements of CPU/RAM/battery/latency. The consumer's JS remains present in the
no-VLC variant to isolate native linkage. Build timings in the JSON depend on
warm caches and must not be interpreted as a performance comparison.

Conclusion: extraction makes a reusable, independently tested package; it does
not shrink the full prebuilt VLC engine. Further significant native-size work
requires a separate engine-build experiment, followed by this same comparison.
No custom VLC build, app installation or production deployment was performed.

The measured fixed JS snapshot used package alpha.1. Final source delivery alpha.2
adds opt-in engine options so consumer-specific VLC tuning can remain in the app
adapter rather than becoming library defaults. Native binding and engine versions
are unchanged. These numbers quantify the controlled native-engine increment;
they are not a byte-exact size claim for a newly rebuilt alpha.2 consumer APK.
