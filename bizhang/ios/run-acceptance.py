#!/usr/bin/env python3
"""Run with a NEW BiZhang seed password on stdin; never prints credentials."""
import datetime
import os
from pathlib import Path
import subprocess
import sys

DEVICE = os.environ.get('BZ_SIMULATOR_ID', '3F5C0C26-5630-4912-A62D-CAAAF725068F')
ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'bizhang/evidence'
EVIDENCE.mkdir(exist_ok=True)
password = sys.stdin.read().strip()
if len(password) < 12:
    raise SystemExit('Supply the new BiZhang acceptance password on stdin')
env = os.environ.copy()
env['TEST_RUNNER_BZ_TEST_PASSWORD'] = password
stamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')


def test(phase):
    test_env = env.copy()
    if phase != 'all':
        test_env['TEST_RUNNER_BZ_TEST_PHASE'] = phase
    command = [
        'xcodebuild', '-project', str(ROOT / 'bizhang/ios/BiZhang.xcodeproj'),
        '-scheme', 'BiZhang', '-configuration', 'Debug',
        '-destination', f'platform=iOS Simulator,id={DEVICE}',
        '-derivedDataPath', '/private/tmp/bizhang-build',
        '-resultBundlePath', f'/private/tmp/bizhang-{stamp}-{phase}.xcresult',
        'test',
    ]
    if phase != 'all':
        command += ['-only-testing:BiZhangTests/BiZhangTests/testProcessPersistence']
    with (EVIDENCE / f'xctest-{phase}.log').open('w') as output:
        subprocess.run(command, env=test_env, stdout=output,
                       stderr=subprocess.STDOUT, check=True)
    print(f'PASS: XCTest {phase}')


def simctl(*args):
    subprocess.run(['xcrun', 'simctl', *args], check=True)


test('all')
test('persist')
simctl('launch', DEVICE, 'com.smith.bizhang')
simctl('terminate', DEVICE, 'com.smith.bizhang')
simctl('launch', DEVICE, 'com.smith.bizhang')
# The restore test starts another host process, verifies /me and clears auth/cache.
test('restore')
print('PASS: login UI, killed-process persistence, revocation and cleanup')
