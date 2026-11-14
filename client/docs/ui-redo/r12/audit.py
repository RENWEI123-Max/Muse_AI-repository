from pathlib import Path
import re,json,hashlib,struct
root=Path('client');out=root/'docs/ui-redo/r12'
paths=list((root/'src/styles/pages').glob('*.css'))+[root/'src/styles/components.css',root/'src/styles/base.css']
lines=[]
for pattern in [r'#[0-9a-fA-F]{3,8}\b',r'\brgba?\(',r'!important',r'\.device\s']:
 hits=[f'{p}:{i+1}:{line}' for p in paths for i,line in enumerate(p.read_text().splitlines()) if re.search(pattern,line)]
 lines.append(f'{pattern}: {len(hits)}\n'+'\n'.join(hits))
legacy=[root/'src/chat.css',root/'src/fidelity.css',root/'src/styles.css']
pattern=r'\.c6-(person|row|search|results|veil)\b'
hits=[f'{p}:{i+1}:{line}' for p in legacy for i,line in enumerate(p.read_text().splitlines()) if re.search(pattern,line)]
lines.append('legacy R12 selectors: '+str(len(hits))+'\n'+'\n'.join(hits))
s=(root/'src/components/ChatFlow.vue').read_text();script=s.split('</script>')[0];scoped=s.split('<style scoped>')[1]
lines.append('unchanged script hex: '+json.dumps(re.findall(r'#[0-9a-fA-F]{3,8}\b',script)))
lines.append('out-of-scope report scoped hex: '+str(len(re.findall(r'#[0-9a-fA-F]{3,8}\b',scoped))))
b=(out/'baseline-ChatFlow.vue.txt').read_text();lines.append('script unchanged: '+str(b.split('</script>')[0]==script))
lines.append('R11 page CSS prefix unchanged: '+str((root/'src/styles/pages/chat.css').read_text().split('/* R12:')[0].rstrip()==__import__('subprocess').check_output(['git','show','90bce6c:client/src/styles/pages/chat.css'],text=True).rstrip()))
(out/'architecture.log').write_text('\n\n'.join(lines)+'\n')
a=[]
for p in sorted(out.glob('*.png')):
 data=p.read_bytes();w,h=struct.unpack('>II',data[16:24]);a.append({'file':p.name,'width':w,'height':h,'sha256':hashlib.sha256(data).hexdigest()})
(out/'screenshots.json').write_text(json.dumps(a,indent=2)+'\n')
