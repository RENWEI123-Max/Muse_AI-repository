"""Inventory tracked + visible untracked files, excluding ignored dependencies and .git."""
import json,subprocess,re
from pathlib import Path
root=Path(__file__).resolve().parents[4]
files=set(subprocess.check_output(['git','ls-files','-c','-o','--exclude-standard','-z'],cwd=root).decode().split('\0'))
important=[];empty=[];hexes=[];cssHex=[]
for name in sorted(files):
 if not name:continue
 p=root/name
 if not p.is_file():continue
 data=p.read_bytes()
 if not data:empty.append(name)
 try:s=data.decode('utf8')
 except UnicodeError:continue
 for i,line in enumerate(s.splitlines(),1):
  marker='!'+'important'
  if marker in line:important.append({'file':name,'line':i,'count':line.count(marker)})
  if name.startswith('client/src/') and p.name!='tokens.css' and re.search(r'#[0-9a-fA-F]{3,8}\b',line):
   hexes.append({'file':name,'line':i,'text':line[:350]})
   if p.suffix=='.css':cssHex.append({'file':name,'line':i})
result={'scope':'git tracked + nonignored untracked UTF-8 files; binary assets omitted; issue-number comments distinguished from actual colors','importantOccurrences':sum(r['count'] for r in important),'importantLines':important,'runtimeImportant':[r for r in important if r['file'].startswith('client/src/')],'emptyFiles':empty,'hexLikeLiteralsOutsideTokens':hexes,'cssHexOutsideTokens':cssHex}
(root/'client/docs/ui-redo/r25/static-inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print({k:v for k,v in result.items() if k in ['importantOccurrences','runtimeImportant','emptyFiles','cssHexOutsideTokens']})
