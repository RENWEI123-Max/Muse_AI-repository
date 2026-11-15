"""Finalize evidence only after all regression completion attempts and live walkthrough."""
import json,hashlib,struct,subprocess
from pathlib import Path
out=Path(__file__).resolve().parent;root=out.parents[3]
assert (out/'regression-final-complete').exists()
assert json.loads((out/'walkthrough-exit.json').read_text())['exit']==0
# Replace the only reference to the historical empty placeholder before deleting it.
p=root/'client/docs/ui-redo/R18-audit-result.md';s=p.read_text()
old='前轮空 [walkthrough-baseline.log](r18-audit/walkthrough-baseline.log) 无可推断错误，保留原状。'
new='前轮空日志无可推断错误；R25收尾已移除该空占位，保留后续真实错误诊断。'
assert old in s;p.write_text(s.replace(old,new))
p=root/'client/docs/ui-redo/r18-audit/walkthrough-baseline.log';assert p.stat().st_size==0;p.unlink()
deleted=json.loads((out/'deleted-files.json').read_text())
for rel in ['r21/comparison.log','r21/walkthrough.log','r23/walkthrough.log','r18-audit/walkthrough-baseline.log']:
 deleted.append({'path':'client/docs/ui-redo/'+rel,'reason':'empty UI-redo log placeholder; no active reference remains','referenceUpdate':'R18-audit-result.md' if rel.startswith('r18-') else None})
(out/'deleted-files.json').write_text(json.dumps(deleted,indent=2)+'\n')
records=[]
for p in sorted(out.glob('*.png')):
 data=p.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';width,height=struct.unpack('>II',data[16:24]);assert (width,height)==(375,667)
 records.append({'file':p.name,'width':width,'height':height,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
(out/'screenshots.json').write_text(json.dumps(records,indent=2)+'\n')
text='# R25 actual screenshots\n\nThese PNGs were captured from the live 375×667 app in this run. They are separate from derived historical composites in total/. Missing states are recorded in walkthrough.json, never filled with references or fixtures.\n\n| File | Size | SHA256 |\n| --- | --- | --- |\n'
for r in records:text+=f'| [{r["file"]}]({r["file"]}) | 375×667 | {r["sha256"]} |\n'
(out/'screenshots.md').write_text(text)
p=out/'write-result.py';s=p.read_text().replace('r18空历史日志的最终处理见静态清单。','先在R18-audit-result.md移除空日志链接、说明删除原因，再删除r18-audit/walkthrough-baseline.log；最终空文件扫描见静态清单。');p.write_text(s)
for script in ['static-audit.py','write-total.py','write-result.py']:subprocess.run(['python3',str(out/script)],cwd=root,check=True)
print('Finalized actual PNGs:',len(records))
