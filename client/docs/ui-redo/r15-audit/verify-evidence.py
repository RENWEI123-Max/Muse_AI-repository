from pathlib import Path
import json,re,struct,hashlib,subprocess
root=Path(__file__).resolve().parent
repo=root.parents[3]
# This script is run from repository root; content checks cover changed source only.
files=['client/src/components/AuthFlow.vue','client/src/styles/pages/auth.css','client/tests/r15-audit.spec.ts','client/tests/r15-audit.config.ts']
checks={}
for f in files:
 s=Path(f).read_text();checks[f]={'hex':len(re.findall(r'#[0-9a-fA-F]{3,8}\b',s)),'important':s.count('!important'),'device_prefix':len(re.findall(r'\.device\b',s))}
unchanged={}
for f in ['client/src/App.vue','client/src/lib/api.ts','client/src/lib/i18n.ts','client/src/lib/support-content.ts','client/src/styles/tokens.css','client/src/styles/base.css','client/src/styles/components.css','client/src/components/HomeFlow.vue']:
 unchanged[f]=subprocess.check_output(['git','show',f'8cc7341:{f}'])==Path(f).read_bytes()
auth=Path(files[0]).read_text();old=subprocess.check_output(['git','show','8cc7341:'+files[0]],text=True)
# All authentication business methods remain exactly as in the base.
business={}
for name in ['validEmail','request','sendCode','submit','verify','apple','logout']:
 pattern=rf'(?:async )?function {name}\([^\n]*[\s\S]*?(?=\n(?:async )?function |\n</script>)'
 business[name]=re.search(pattern,auth)[0]==re.search(pattern,old)[0]
summary=[]
for h in [667,812]:
 for lang in ['en','ko']:
  d=json.loads(root.joinpath(f'{h}-{lang}-walkthrough.json').read_text());assert d['completed'] and not d['errors'] and not d['forbidden']
  summary.append({'height':h,'lang':lang,'records':len(d['records']),'screenshots':len(list(root.glob(f'{h}-{lang}-*.png'))),'clipped_width':sum(c['clipped'] for r in d['records'] for c in r['copy']),'checks':d['checks'],'scroll':{r['name']:r['containers'] for r in d['records'] if r['name'] in ['welcome','terms-scrolled','signup-mismatch-scrolled']},'all_document_locked':all(r['document']=={'height':h,'width':375,'y':0} for r in d['records']),'auth_motion':sorted({(m['animation'],m['transition']) for r in d['records'] for m in r['motion']})})
png=[]
for f in sorted(root.glob('*.png')):
 b=f.read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',b[16:24]);assert w==375 and h in [667,812];png.append({'file':f.name,'width':w,'height':h,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
assert not list(root.glob('*verify-resend*.png'))
assert all(all(v==0 for v in c.values()) for c in checks.values()) and all(unchanged.values()) and all(business.values())
root.joinpath('source-checks.json').write_text(json.dumps({'grep':checks,'unchanged':unchanged,'business_methods_unchanged':business},indent=2))
root.joinpath('screenshots.json').write_text(json.dumps(png,indent=2))
root.joinpath('summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps({'png':len(png),'groups':summary,'source_checks':checks},ensure_ascii=False,indent=2))
