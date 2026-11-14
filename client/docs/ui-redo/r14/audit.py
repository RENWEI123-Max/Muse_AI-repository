from pathlib import Path
import re,subprocess,json
root=Path(__file__).resolve().parents[3];src=root/'src';out=Path(__file__).parent
logs=[]
paths=list((src/'styles/pages').glob('*.css'))+[src/'styles/components.css',src/'styles/base.css']
for label,pattern in [('color literals',r'#[0-9a-fA-F]{3,8}\b|\brgba?\('),('important',r'!important'),('device prefix',r'\.device\s')]:
 hits=[str(p.relative_to(root)) for p in paths if re.search(pattern,re.sub(r'/\*.*?\*/','',p.read_text(),flags=re.S))];logs.append(f'{label}: {len(hits)} {hits}')
for f in ['ChatFlow.vue','InboxFlow.vue']:
 p=src/'components'/f;old=subprocess.check_output(['git','show','2cdbd9d:client/src/components/'+f],cwd=root).decode();new=p.read_text();logs.append(f'{f} script exact: {old.split("</script>")[0]==new.split("</script>")[0]}')
 for attr in ['id','data-state','aria-label']:
  before=re.findall(r'(?<![\w-])'+attr+r'="([^"]*)"',old);after=re.findall(r'(?<![\w-])'+attr+r'="([^"]*)"',new);logs.append(f'{f} missing {attr}: {[x for x in before if x not in after]}')
logs.append('old CSS safety rules: '+str([(str(p.relative_to(root)),m.group()) for p in [src/'styles.css',src/'fidelity.css',src/'chat.css',src/'styles/pages/inbox.css',src/'styles/pages/appearance.css'] for m in re.finditer(r'[^{}]*(?:\.d3-|\.inbox-block-|\[data-state\^="report")[^{}]*\{',re.sub(r'/\*.*?\*/','',p.read_text(),flags=re.S))]))
logs.append('HomeFlow unchanged: '+str(not subprocess.check_output(['git','diff','2cdbd9d','--','client/src/components/HomeFlow.vue'],cwd=root)))
logs.append('safety selectors: '+str(re.findall(r'([^{}]+)\{',(src/'styles/pages/safety.css').read_text())))
(out/'architecture-audit.txt').write_text('\n'.join(logs))
print('\n'.join(logs[:15]))
