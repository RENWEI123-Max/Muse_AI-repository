#!/usr/bin/env python3
"""Own temporary credentials stay in process memory; never reads preexisting secrets."""
import os, secrets, subprocess, pathlib
root=pathlib.Path(__file__).resolve().parents[2]
name='d4_'+secrets.token_hex(6)
password=secrets.token_urlsafe(32)
remote=r'''
import {hashPassword} from '/srv/bizhang/server/src/password.js';
import {execFileSync} from 'node:child_process';
let input='';for await (const part of process.stdin) input+=part;
const {name,password}=JSON.parse(input);
const hash=await hashPassword(password);
execFileSync('docker',['exec','-i','maugo-postgres-1','psql','-X','-v','ON_ERROR_STOP=1','-U','maugo','-d','bizhang','-At'],{input:`SET ROLE bizhang_owner;INSERT INTO users(username,password_hash) VALUES('${name}','${hash}');`,stdio:['pipe','pipe','pipe']});
'''
import json, base64
command="node --input-type=module -e \"$(printf '%s' '"+base64.b64encode(remote.encode()).decode()+"' | base64 -d)\""
subprocess.run(['ssh','sg-claude',command],input=json.dumps({'name':name,'password':password}),text=True,check=True)
print('Temporary account created:',name,flush=True)
env=os.environ.copy();env['TEST_RUNNER_BZ_TEST_USERNAME']=name;env['TEST_RUNNER_BZ_TEST_PASSWORD']=password
args=['xcodebuild','-project',str(root/'bizhang/ios/BiZhang.xcodeproj'),'-scheme','BiZhang','-configuration','Debug','-destination','platform=iOS Simulator,id=3F5C0C26-5630-4912-A62D-CAAAF725068F','-derivedDataPath','/private/tmp/bizhang-d4-build','test']
try:
 with (root/'bizhang/evidence/d4/xctest.log').open('w') as log:
  result=subprocess.run(args,env=env,stdout=log,stderr=subprocess.STDOUT)
 print('XCTest exit:',result.returncode,flush=True)
 if result.returncode: raise SystemExit(result.returncode)
 # Keep a login in the simulator for manual screenshot / offline relaunch checks.
 env['TEST_RUNNER_BZ_TEST_PHASE']='persist'
 with (root/'bizhang/evidence/d4/persist.log').open('w') as log:
  subprocess.run(args+['-only-testing:BiZhangTests/BiZhangTests/testProcessPersistence'],env=env,stdout=log,stderr=subprocess.STDOUT,check=True)
 print('READY_FOR_SCREENSHOTS',flush=True)
 while True:
  mode=input('Evidence mode live/offline/stale/recovered, or done: ').strip()
  if mode=='done': break
  if mode=='suite':
   suite_env=env.copy();suite_env.pop('TEST_RUNNER_BZ_TEST_PHASE',None);suite_env.pop('TEST_RUNNER_BZ_D4_MODE',None)
   with (root/'bizhang/evidence/d4/xctest-final.log').open('w') as log:
    r=subprocess.run(args,env=suite_env,stdout=log,stderr=subprocess.STDOUT)
   print('Final suite exit:',r.returncode,flush=True)
   continue
  if mode not in ['live','offline','stale','recovered']: continue
  env['TEST_RUNNER_BZ_D4_MODE']=mode
  with (root/f'bizhang/evidence/d4/{mode}.log').open('w') as log:
   r=subprocess.run(args+['-only-testing:BiZhangTests/BiZhangTests/testD4Evidence'],env=env,stdout=log,stderr=subprocess.STDOUT)
  print(mode,'exit:',r.returncode,flush=True)
  container=subprocess.check_output(['xcrun','simctl','get_app_container','3F5C0C26-5630-4912-A62D-CAAAF725068F','com.smith.bizhang','data'],text=True).strip()
  import shutil
  for f in pathlib.Path(container,'Documents').glob(mode+'-*'): shutil.copy(f,root/'bizhang/evidence/d4'/f.name)
finally:
 sql=f"SET ROLE bizhang_owner;DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE username='{name}');DELETE FROM users WHERE username='{name}';SELECT count(*) FROM users WHERE username='{name}';"
 result=subprocess.run(['ssh','sg-claude',"docker exec -i maugo-postgres-1 psql -X -v ON_ERROR_STOP=1 -U maugo -d bizhang -At"],input=sql,text=True,capture_output=True,check=True)
 print('Cleanup:',result.stdout.strip(),flush=True)
