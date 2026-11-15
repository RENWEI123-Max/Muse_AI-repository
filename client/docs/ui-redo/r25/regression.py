"""Sequential R25 regression; each suite owns its isolated backend. No assertion changes."""
import json,os,re,signal,subprocess,time
from pathlib import Path
root=Path(__file__).resolve().parents[3]
os.chdir(root)
out=root/'docs/ui-redo/r25'
configs=sorted(p for p in Path('tests').glob('*.config.ts'))+[Path('playwright.r10.config.ts'),Path('playwright.r13.config.ts')]+sorted(Path('docs/fidelity-refactor').glob('*config.ts'))
rows=[]
# All unconfigured specs run with the original default harness, individually reported.
matched=set()
for c in configs:
 matched.update(re.findall(r"['\"]([\w*-]+\.spec\.ts)['\"]",c.read_text()))
main=[p.name for p in Path('tests').glob('*.spec.ts') if p.name not in matched and not p.name.startswith(('r','baseline'))]
commands=[('default-'+p,['-c','playwright.config.ts',p]) for p in sorted(main)]
commands += [(str(c).replace('/','_'),['-c',str(c)]) for c in configs]
# Preserve old tracked evidence; suite outputs are not new R25 screenshots.
protected={'client/docs/ui-redo/r21/preview.log','client/docs/ui-redo/r21/comparison.log','client/docs/ui-redo/r21/walkthrough.log','client/docs/ui-redo/r23/walkthrough.log'}
def restore_evidence():
 files=subprocess.check_output(['git','diff','--name-only'],text=True).splitlines()
 for f in files:
  if f.startswith('client/docs/') and '/r25/' not in f and f not in protected:
   data=subprocess.run(['git','show','HEAD:'+f],capture_output=True)
   if data.returncode==0:
    target=root.parent/f;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data.stdout)
for name,args in commands:
 log=out/(name+'.log');report=out/(name+'.json')
 env={**os.environ,'MAUGO_API_TARGET':'http://127.0.0.1:3001','PLAYWRIGHT_JSON_OUTPUT_NAME':str(report)}
 # Historical configs without webServer depend on separately launched servers; record their actual connection failures.
 cmd=['node_modules/.bin/playwright','test',*args,'--workers=1','--retries=0','--reporter=list,json','--output=/tmp/maugo-r25-'+name]
 start=time.time();print('START',name,flush=True)
 with log.open('w') as f:
  p=subprocess.Popen(cmd,stdout=f,stderr=subprocess.STDOUT,env=env,start_new_session=True)
  timed=False
  try:code=p.wait(timeout=480)
  except subprocess.TimeoutExpired:
   timed=True;os.killpg(p.pid,signal.SIGTERM)
   try:code=p.wait(timeout=15)
   except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);code=p.wait()
 row={'suite':name,'command':cmd,'exit':code,'timeout':timed,'seconds':round(time.time()-start,1),'log':log.name}
 if report.exists():
  try:
   j=json.loads(report.read_text());row['stats']=j.get('stats',{});row['errors']=j.get('errors',[])
  except Exception as e:row['reportError']=str(e)
 rows.append(row);(out/'regression.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 restore_evidence();print('DONE',name,code,row.get('stats',{}),flush=True)
(out/'regression-complete').write_text('completed\n')
