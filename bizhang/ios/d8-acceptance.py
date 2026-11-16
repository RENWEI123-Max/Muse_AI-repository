#!/usr/bin/env python3
"""D8 simulator acceptance (DEBUG, loopback, dedicated generated account). Generates its own disposable account in memory.
Never reads existing secrets; always removes only this run's d8_ data.
"""
import base64
import json
import os
from pathlib import Path
import secrets
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / 'bizhang/evidence/d8'
DEVICE = '3F5C0C26-5630-4912-A62D-CAAAF725068F'
NAME = 'd8_' + secrets.token_hex(6)
PASSWORD = secrets.token_urlsafe(32)
EVIDENCE.mkdir(parents=True, exist_ok=True)

def remote(script, payload):
    # Shell sees only base64-encoded source, never generated password/hash/token.
    source = base64.b64encode(script.encode()).decode()
    command = "node --input-type=module -e \"$(printf '%s' '" + source + "' | base64 -d)\""
    return subprocess.run(['ssh', '-o', 'BatchMode=yes', 'sg-claude', command],
                          input=json.dumps(payload), text=True, check=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout

CREATE = r'''
import {hashPassword} from '/srv/bizhang/server/src/password.js';
import {execFileSync} from 'node:child_process';
let input='';for await(const p of process.stdin)input+=p;
const {name,password}=JSON.parse(input);
if(!/^d8_[0-9a-f]+$/.test(name))throw Error('invalid temporary username');
const hash=await hashPassword(password);
execFileSync('docker',['exec','-i','maugo-postgres-1','psql','-X','-v','ON_ERROR_STOP=1','-U','maugo','-d','bizhang','-At'],{input:`SET ROLE bizhang_owner;INSERT INTO users(username,password_hash) VALUES('${name}','${hash}');`,stdio:['pipe','pipe','pipe']});
console.log('Temporary d8_ user created');
'''
CLEAN = r'''
import {execFileSync} from 'node:child_process';
let input='';for await(const p of process.stdin)input+=p;
const {name}=JSON.parse(input);if(!/^d8_[0-9a-f]+$/.test(name))throw Error('invalid temporary username');
const tables=['telegram_outbox','alert_requests','alert_events','alert_rules','telegram_bindings','daily_summaries','transaction_requests','transactions','sessions'];
let sql=`SET ROLE bizhang_owner;BEGIN;`;
for(const table of tables) sql+=`DELETE FROM ${table} WHERE user_id IN(SELECT id FROM users WHERE username='${name}');`;
sql+=`DELETE FROM users WHERE username='${name}';COMMIT;SELECT 'd8_users_remaining='||count(*) FROM users WHERE username='${name}';`;
for(const table of tables) sql+=`SELECT '${table}_orphans='||count(*) FROM ${table} x LEFT JOIN users u ON x.user_id=u.id WHERE u.id IS NULL;`;
console.log(execFileSync('docker',['exec','-i','maugo-postgres-1','psql','-X','-v','ON_ERROR_STOP=1','-U','maugo','-d','bizhang','-At'],{input:sql,encoding:'utf8'}));
'''

def run_tests(phase, extra_env=None, only=None):
    env = os.environ.copy()
    env.update(TEST_RUNNER_BZ_TEST_USERNAME=NAME, TEST_RUNNER_BZ_TEST_PASSWORD=PASSWORD)
    if extra_env:
        env.update({'TEST_RUNNER_' + key: value for key, value in extra_env.items()})
    cmd = ['xcodebuild', '-project', str(ROOT/'bizhang/ios/BiZhang.xcodeproj'),
           '-scheme', 'BiZhang', '-configuration', 'Debug', '-destination',
           'platform=iOS Simulator,id=' + DEVICE, '-derivedDataPath', '/private/tmp/bizhang-d8-build', 'test']
    if only:
        cmd.append('-only-testing:BiZhangTests/BZD8Tests/' + only)
    with (EVIDENCE / (phase + '.log')).open('w') as log:
        result = subprocess.run(cmd, env=env, stdout=log, stderr=subprocess.STDOUT)
    # Generated values should never be emitted. Redact defensively without displaying.
    path = EVIDENCE/(phase+'.log')
    path.write_text(path.read_text().replace(PASSWORD, '[temporary password redacted]'))
    print(phase, 'exit', result.returncode, flush=True)
    if result.returncode:
        raise RuntimeError(phase + ' failed; inspect log')

if __name__ == '__main__':
    tunnel = None
    try:
        print(remote(CREATE, {'name': NAME, 'password': PASSWORD}).strip(), flush=True)
        # Dedicated tunnel exists only if this run starts it. Never stops other tunnels.
        try:
            urllib.request.urlopen('http://127.0.0.1:13100/api/v1/healthz', timeout=2).close()
        except Exception:
            tunnel = subprocess.Popen(['ssh','-o','BatchMode=yes','-o','ExitOnForwardFailure=yes','-N','-L','13100:127.0.0.1:3100','sg-claude'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        run_tests('xctest-all')
        try:
            run_tests('xctest-live', {'BZ_D8_LIVE':'1'}, 'testD8LiveTemporaryAccountUIAndServerPersistence')
        except RuntimeError:
            print('Live acceptance has failures; collecting evidence before cleanup', flush=True)
        else:
            run_tests('xctest-persist', {'BZ_D8_LIVE':'1','BZ_D8_PHASE':'persist'}, 'testD8LiveTemporaryAccountUIAndServerPersistence')
        container = subprocess.check_output(['xcrun','simctl','get_app_container',DEVICE,'com.smith.bizhang','data'],text=True).strip()
        import shutil
        for path in (Path(container)/'Documents').glob('d8-*'):
            shutil.copy2(path, EVIDENCE/path.name)
        print('Evidence screenshots copied', flush=True)
    finally:
        cleanup = remote(CLEAN, {'name': NAME})
        (EVIDENCE/'cleanup.log').write_text(cleanup)
        print(cleanup.strip(), flush=True)
        if tunnel:
            tunnel.terminate()
            tunnel.wait(timeout=10)
