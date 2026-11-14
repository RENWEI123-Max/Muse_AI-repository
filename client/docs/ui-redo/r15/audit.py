from pathlib import Path
import subprocess,re,json
root=Path(__file__).resolve().parents[3]; repo=root.parent; src=root/'src';out=Path(__file__).parent
lines=[]
for f in ['App.vue','components/AuthFlow.vue']:
 old=subprocess.check_output(['git','show','b0814eb:client/src/'+f],cwd=repo,text=True);new=(src/f).read_text()
 script=lambda s:s.split('</script>')[0]
 assert script(old)==script(new),f+' script changed'
 for attr in ['id','data-state','aria-label']:
  before=re.findall(r'(?<![\w-])'+attr+r'="([^"]*)"',old);after=re.findall(r'(?<![\w-])'+attr+r'="([^"]*)"',new)
  assert all(x in after for x in before),(f,attr)
 lines.append(f+': script byte-identical; existing id/data-state/aria-label retained')
assert subprocess.check_output(['git','diff','b0814eb','--','client/src/components/HomeFlow.vue'],cwd=repo,text=True)==''
lines.append('HomeFlow.vue: unchanged')
paths=list((src/'styles/pages').glob('*.css'))+[src/'styles/components.css',src/'styles/base.css']
for name,pat in [('hex',r'#[0-9a-fA-F]{3,8}\b'),('rgb literal',r'\brgba?\('),('important',r'!important'),('device prefix',r'\.device\s')]:
 found=[str(p.relative_to(src)) for p in paths if re.search(pat,p.read_text())];lines.append(name+': '+json.dumps(found));assert not found
s=(src/'styles/pages/auth.css').read_text()
for selector in re.findall(r'([^{}]+)\{',re.sub(r'/\*.*?\*/','',s,flags=re.S)):
 if selector.strip().startswith('@'):continue
 for part in selector.split(','):
  assert len(part.split())<=2,part
  assert part.strip().startswith(('.auth-','.welcome-screen')),part
lines.append('auth page selectors: root-prefixed, maximum two levels')
for f in ['styles.css','fidelity.css']:
 text=(src/f).read_text();matches=re.findall(r'[^{}]*\.(?:auth-[\w-]+|welcome-screen|flow-content|terms-[\w-]+|show-password|apple-button|apple-orbit|mail-orbit|wordmark|password-hint|privacy-copy)[^{}]*\{',text)
 lines.append(f+' old auth rules: '+str(len(matches)));assert not matches
(out/'architecture-audit.txt').write_text('\n'.join(lines)+'\n');print('\n'.join(lines))
