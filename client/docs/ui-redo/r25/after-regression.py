"""Run real walkthrough only after every regression suite releases its isolated backend."""
import os,subprocess,time,urllib.request,json
from pathlib import Path
root=Path(__file__).resolve().parents[3];os.chdir(root);out=root/'docs/ui-redo/r25'
while not (out/'regression-complete').exists():time.sleep(2)
subprocess.run(['python3',str(out/'complete-regression.py')],check=True)
backendLog=(out/'server.log').open('w');frontendLog=(out/'preview.log').open('w')
b=subprocess.Popen(['../maugo/node_modules/.bin/tsx','docs/ui-redo/r25/server.mjs'],stdout=backendLog,stderr=subprocess.STDOUT)
f=subprocess.Popen(['npm','run','dev','--','--port','5355','--strictPort'],env={**os.environ,'MAUGO_API_TARGET':'http://127.0.0.1:3001'},stdout=frontendLog,stderr=subprocess.STDOUT)
try:
 for url in ['http://127.0.0.1:3001/health','http://127.0.0.1:5355']:
  for i in range(60):
   try:urllib.request.urlopen(url,timeout=1);break
   except Exception:time.sleep(1)
  else:raise RuntimeError('server unavailable '+url)
 with (out/'walkthrough.log').open('w') as log:r=subprocess.run(['node','docs/ui-redo/r25/walkthrough.mjs'],stdout=log,stderr=subprocess.STDOUT,timeout=600)
 (out/'walkthrough-exit.json').write_text(json.dumps({'exit':r.returncode})+'\n')
finally:
 for p in [f,b]:p.terminate()
 for p in [f,b]:
  try:p.wait(timeout=10)
  except subprocess.TimeoutExpired:p.kill()
