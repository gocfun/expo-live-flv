#!/usr/bin/env python3
"""Measure one disposable consumer snapshot with/without native VLC linkage.
No production signing, installation, publishing or backend requests are performed.
Installed node_modules is shared for identical dependency versions, so Gradle may
write ordinary native build caches there. Application sources are not changed.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import time
import zipfile

FILES = ['package.json', 'pnpm-lock.yaml', 'app.json', 'app.config.js', 'index.js',
         'babel.config.js', 'metro.config.js', 'tailwind.config.js', 'postcss.config.js',
         'nativewind-env.d.ts', 'tsconfig.json', 'components.json', 'google-services.json']
DIRS = ['src', 'assets', 'public', 'vendor', 'android']

def ignored(folder, names):
    return [n for n in names if n in {'node_modules', '.git', '.gradle', '.cxx', '.kotlin', 'build', '.DS_Store'}
            or n.startswith('.env') or n.endswith('.jks')
            or (n.endswith('.keystore') and n != 'debug.keystore')]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def inspect_apk(path):
    with zipfile.ZipFile(path) as apk:
        libs = [i for i in apk.infolist() if i.filename.startswith('lib/') and i.filename.endswith('.so')]
        vlc = [i for i in libs if i.filename.endswith(('/libvlc.so', '/libvlcjni.so'))]
        bundles = [i for i in apk.infolist() if i.filename == 'assets/index.android.bundle']
        if len(bundles) != 1:
            raise RuntimeError('Expected an embedded release JS bundle')
        if any(not i.filename.startswith('lib/arm64-v8a/') for i in libs):
            raise RuntimeError('Unexpected non-arm64 native library in APK')
        return dict(bytes=path.stat().st_size, sha256=digest(path),
                    native_stored_bytes=sum(i.compress_size for i in libs),
                    vlc_stored_bytes=sum(i.compress_size for i in vlc),
                    vlc_libraries=[i.filename for i in vlc],
                    js_bundle_sha256=hashlib.sha256(apk.read(bundles[0])).hexdigest(),
                    native_library_count=len(libs))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--scratch', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--resume', action='store_true', help='Reuse only a marked snapshot after a failed build')
    args = parser.parse_args()
    source, root, out = [p.resolve() for p in (args.source, args.scratch, args.out)]
    if root == source or source in root.parents or root in source.parents:
        raise SystemExit('Scratch must be outside the source checkout')
    marker = root / '.flv-size-snapshot.json'
    if root.exists():
        if not args.resume or not marker.is_file() or json.loads(marker.read_text()).get('source') != str(source):
            raise SystemExit('Scratch must be fresh, or use --resume with a matching marked snapshot')
    else:
        root.mkdir(parents=True)
        for name in FILES:
            if (source / name).is_file(): shutil.copy2(source / name, root / name)
        for name in DIRS:
            if (source / name).is_dir(): shutil.copytree(source / name, root / name, ignore=ignored)
        (root / 'node_modules').symlink_to(source / 'node_modules', target_is_directory=True)
        marker.write_text(json.dumps(dict(source=str(source))) + '\n')
    out.mkdir(parents=True, exist_ok=True)
    # Watchman may attempt to crawl the enclosing workspace of a scratch project.
    # Only this snapshot uses the Node crawler and explicitly watches shared deps.
    gradle_text = (root / 'android/app/build.gradle').read_text()
    release = re.search(r'(?ms)^\s{8}release\s*\{(.*?)^\s{8}\}', gradle_text)
    if not release or not re.search(r'signingConfig\s+signingConfigs\.debug\b', release.group(1)):
        raise SystemExit('Expected standard Expo release signingConfigs.debug; production/custom signing is unsupported')
    if not (root / 'android/app/debug.keystore').is_file():
        raise SystemExit('Expected the copied standard Android debug keystore')
    metro = root / 'metro.config.js'
    if 'expo-live-flv benchmark wiring' not in metro.read_text():
        with metro.open('a') as f:
            f.write("\n// expo-live-flv benchmark wiring\n"
                    "module.exports.resolver.useWatchman = false;\n"
                    "module.exports.watchFolders = [...new Set([...(module.exports.watchFolders || []), require('fs').realpathSync(require('path').join(__dirname, 'node_modules'))])];\n")
    package_path = root / 'package.json'
    original_package = json.loads(package_path.read_text())
    source_hash = hashlib.sha256()
    inputs = []
    for folder, dirs, files in os.walk(root, followlinks=False):
        skip = set(ignored(folder, dirs))
        dirs[:] = [d for d in dirs if d not in skip]
        inputs.extend(Path(folder) / name for name in files if name not in ignored(folder, files))
    for file in sorted(inputs):
        if file == marker: continue
        source_hash.update(str(file.relative_to(root)).encode())
        source_hash.update(bytes.fromhex(digest(file)))
    env = dict(os.environ, CI='1', EXPO_NO_DOTENV='1', EXPO_NO_TELEMETRY='1', EXPO_PUBLIC_LIVE_PLAYER='libvlc')
    env.setdefault('ANDROID_HOME', str(Path.home() / 'Library/Android/sdk'))
    flags = ['--console=plain', '--no-daemon', '--no-parallel', '--max-workers=2',
             '--no-configuration-cache', '-PreactNativeArchitectures=arm64-v8a',
             '-Pandroid.enableMinifyInReleaseBuilds=true',
             '-Pandroid.enableShrinkResourcesInReleaseBuilds=true',
             '-Dorg.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m']
    result = dict(snapshot_sha256=source_hash.hexdigest(),
                  dependency_lock_sha256=digest(root / 'pnpm-lock.yaml'),
                  metro_wiring='Node crawler; shared node_modules explicitly watched; same for both variants',
                  platform=platform.system(), node=subprocess.check_output(['node', '--version'], text=True).strip(),
                  release_flags=flags, signing='existing debug key, not production signed', variants={})
    try:
        # Same JS/dependencies/config throughout. Only Expo native discovery varies.
        for variant, enabled in [('with-vlc', True), ('without-vlc', False)]:
            package = json.loads(json.dumps(original_package))
            if not enabled:
                native = package.setdefault('expo', {}).setdefault('autolinking', {}).setdefault('android', {})
                native['exclude'] = sorted(set(native.get('exclude', []) + ['expo-libvlc-player']))
            package_path.write_text(json.dumps(package, indent=2) + '\n')
            print(json.dumps(dict(phase='resolving-native-modules', variant=variant)), flush=True)
            cli = root / 'node_modules/expo-modules-autolinking/bin/expo-modules-autolinking.js'
            resolved = subprocess.check_output(['node', str(cli), 'resolve', '--platform', 'android', '--json'],
                                               cwd=root, env=env, text=True)
            (out / f'{variant}-autolinking.json').write_text(resolved)
            modules = json.loads(resolved).get('modules', [])
            found = any(m.get('packageName') == 'expo-libvlc-player' for m in modules)
            if found != enabled:
                raise RuntimeError(f'Unexpected native discovery for {variant}: VLC={found}')
            print(json.dumps(dict(phase='building-release-arm64', variant=variant)), flush=True)
            start = time.monotonic()
            with (out / f'{variant}-build.log').open('w') as log:
                subprocess.run([str(root / 'android/gradlew'), '-p', str(root / 'android'), ':app:assembleRelease', *flags],
                               cwd=root, env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
            artifact = root / 'android/app/build/outputs/apk/release/app-release.apk'
            dest = out / f'{variant}-release-arm64.apk'
            shutil.copy2(artifact, dest)
            metrics = inspect_apk(dest)
            if bool(metrics['vlc_libraries']) != enabled:
                raise RuntimeError(f'APK VLC inclusion check failed for {variant}')
            metrics['build_seconds'] = round(time.monotonic() - start, 1)
            result['variants'][variant] = metrics
            (out / 'measurements.json').write_text(json.dumps(result, indent=2) + '\n')
            print(json.dumps(dict(phase='built', variant=variant, bytes=metrics['bytes'])), flush=True)
        yes, no = result['variants']['with-vlc'], result['variants']['without-vlc']
        if yes['js_bundle_sha256'] != no['js_bundle_sha256']:
            raise RuntimeError('JS bundles differ; native-only A/B comparison is not valid')
        result['js_bundles_identical'] = True
        result['delta_bytes'] = yes['bytes'] - no['bytes']
        result['delta_percent'] = round(100 * result['delta_bytes'] / no['bytes'], 2)
        (out / 'measurements.json').write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result, indent=2), flush=True)
    finally:
        package_path.write_text(json.dumps(original_package, indent=2) + '\n')

if __name__ == '__main__': main()
