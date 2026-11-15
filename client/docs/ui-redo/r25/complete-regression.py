"""Complete any suite interrupted by the orchestration guard, retaining the first attempt.
No suite-wide timeout on completion: original per-test timeouts and assertions remain.
"""
import json,os,subprocess,time,re,signal
from pathlib import Path
root=Path(__file__).resolve().parents[3];os.chdir(root);out=root/'docs/ui-redo/r25'
rows=json.loads((out/'regression.json').read_text())
protected={'client/docs/ui-redo/r21/preview.log','client/docs/ui-redo/r21/comparison.log','client/docs/ui-redo/r21/walkthrough.log','client/docs/ui-redo/r23/walkthrough.log'}
cleanup=[]
def cleanup_owned():
 # These ports belong only to timed-out R25 commands; never inspect/stop demo 3000.
 ports={3001}
 for row in rows:
  if not row.get('timeout'):continue
  config=row['command'][row['command'].index('-c')+1]
  source=(root/config).read_text()
  ports.update(int(x) for x in re.findall(r"baseURL\s*:\s*['\"]http://127\.0\.0\.1:(\d+)",source))
 for port in sorted(ports):
  found=subprocess.run(['lsof','-nP','-t','-iTCP:'+str(port),'-sTCP:LISTEN'],capture_output=True,text=True)
  for value in set(found.stdout.split()):
   pid=int(value);cmd=subprocess.check_output(['ps','-p',value,'-o','command='],text=True).strip()
   known=(port==3001 and any('tests/'+n in cmd for n in ['auth-server.mjs','d6-followup-server.mjs'])) or (str(root)+'/node_modules/.bin/vite' in cmd and '--port '+str(port) in cmd)
   if not known:raise RuntimeError('Unknown listener; refusing cleanup on '+str(port)+' PID '+value+' '+cmd)
   cleanup.append({'port':port,'pid':pid,'command':cmd,'reason':'owned R25 timed-out suite residual listener'})
   try:os.kill(pid,signal.SIGTERM)
   except ProcessLookupError:continue
   for _ in range(25):
    time.sleep(.2)
    if subprocess.run(['ps','-p',value],stdout=subprocess.DEVNULL).returncode!=0:break
   else:
    try:os.kill(pid,signal.SIGKILL)
    except ProcessLookupError:pass
 (out/'orphan-cleanup.json').write_text(json.dumps(cleanup,indent=2)+'\n')
cleanup_owned()

for previous in sorted(list(rows),key=lambda r:0 if r['suite'] in ['tests_d7.config.ts','tests_d8.config.ts','tests_f06.config.ts','tests_f07.config.ts'] else 1):
 previewAffected=previous['suite'] in ['tests_legal-copy.config.ts','tests_r06-audit.config.ts','tests_r08-audit.config.ts','tests_r09-audit.config.ts','tests_r10-audit.config.ts','tests_r11-audit.config.ts','tests_r12-audit.config.ts','tests_r13-audit.config.ts','tests_r14-audit.config.ts','tests_r15-audit.config.ts','tests_r15.config.ts']
 if not previous.get('timeout') and not previewAffected and 'is already used' not in (out/previous['log']).read_text(errors='replace'):continue
 if previewAffected:previous['supersededReason']='Initial preview build omitted VITE_API_BASE_URL=/api; repeated with isolated test build'
 if not previous.get('stats'):
  partial=(out/previous['log']).read_text(errors='replace')
  running=re.search(r'Running (\d+) tests? using',partial)
  passed=len(re.findall(r'^\s*✓\s+\d+ ',partial,re.M));failed=len(re.findall(r'^\s*✘\s+\d+ ',partial,re.M))
  previous['stats']={'expected':passed,'unexpected':failed,'skipped':max(0,int(running[1])-passed-failed) if running else 0,'partialFromListLog':True,'uncollectedTotal':not bool(running)}
 cleanup_owned()
 name=previous['suite']+'-completion';log=out/(name+'.log');report=out/(name+'.json');cmd=previous['command']
 print('COMPLETE START',name,flush=True);start=time.time()
 with log.open('w') as f:r=subprocess.run(cmd,env={**os.environ,'MAUGO_API_TARGET':'http://127.0.0.1:3001','PLAYWRIGHT_JSON_OUTPUT_NAME':str(report)},stdout=f,stderr=subprocess.STDOUT,start_new_session=True)
 row={'suite':name,'completes':previous['suite'],'command':cmd,'exit':r.returncode,'timeout':False,'seconds':round(time.time()-start,1),'log':log.name}
 if report.exists():
  j=json.loads(report.read_text());row['stats']=j.get('stats',{});row['errors']=j.get('errors',[])
 rows.append(row);(out/'regression.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 for f in subprocess.check_output(['git','diff','--name-only'],text=True).splitlines():
  if f.startswith('client/docs/') and '/r25/' not in f and f not in protected:
   data=subprocess.run(['git','show','HEAD:'+f],capture_output=True)
   if data.returncode==0:(root.parent/f).write_bytes(data.stdout)
 print('COMPLETE DONE',name,r.returncode,flush=True)
cleanup_owned()
(out/'regression-final-complete').write_text('All suite commands finished; failures and skips retained.\n')
