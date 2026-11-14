"""Read-only checks against the specified R19 audit baseline."""
import hashlib,json,pathlib,re,subprocess
root=pathlib.Path(__file__).resolve().parents[4];out=pathlib.Path(__file__).resolve().parent
base='f3a9ccd'
def old(p):return subprocess.check_output(['git','show',base+':'+p],cwd=root).decode()
def digest(s):return hashlib.sha256(s.encode()).hexdigest()
result={'baseline':base}
for p in ['client/src/components/MomentsFlow.vue','client/src/components/ProfileFlow.vue']:
 a=old(p);b=(root/p).read_text();script=lambda s:s.split('<script setup',1)[1].split('</script>',1)[0]
 assert script(a)==script(b),p
 result[p]={'scriptUnchanged':True,'scriptSHA256':digest(script(b)),'wholeFileUnchanged':a==b}
 ptn=r'[^\n]*@keydown\.esc[^\n]*'
 # R16/R17/R18 Profile entire line plus R19 cards overlay handler must remain literal.
 if p.endswith('ProfileFlow.vue'):assert re.findall(ptn,a)==re.findall(ptn,b)
 else:assert '@keydown.esc.stop="back"' in b.split('class="cards-overlay"',1)[1].split('>',1)[0]
result['escapeProtectionMatchesBase']=True
patterns={'hex':r'#[0-9a-fA-F]{3,8}','rgb':r'rgba?\(','important':r'!important','device':r'\.device\s'}
files=list((root/'client/src/styles/pages').glob('*.css'))+[root/'client/src/styles/components.css',root/'client/src/styles/base.css',root/'client/src/components/MomentsFlow.vue']
result['A5CurrentScan']={name:sum(len(re.findall(p,f.read_text())) for f in files) for name,p in patterns.items()}
assert all(v==0 for v in result['A5CurrentScan'].values())
result['legacySelectors']={p:len(re.findall(r'\.d5|\.profile-card-actions|\.moment-|\.moments-',(root/p).read_text())) for p in ['client/src/styles.css','client/src/fidelity.css']}
assert all(v==0 for v in result['legacySelectors'].values())
changed=subprocess.check_output(['git','diff','--name-only',base,'--','client/src'],cwd=root,text=True).splitlines()
result['productionChanged']=changed
assert set(changed)<=set(['client/src/components/MomentsFlow.vue','client/src/styles/pages/moments.css'])
(out/'architecture.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
