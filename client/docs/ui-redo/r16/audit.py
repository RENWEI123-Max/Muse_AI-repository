from pathlib import Path
import re,json,subprocess
paths=list(Path('client/src/styles/pages').glob('*.css'))+[Path('client/src/styles/components.css'),Path('client/src/styles/base.css')]+[Path('client/src/components')/x for x in ['HomeFlow.vue','LettersFlow.vue','InboxFlow.vue','ChatFlow.vue','AuthFlow.vue','ProfileFlow.vue']]
results={}
for label,pat in [('hex',r'#[0-9a-fA-F]{3,8}\b'),('rgb-literal',r'\brgba?\(')]:
 results[label]=[{'file':str(p),'line':i,'text':line} for p in paths for i,line in enumerate(p.read_text().splitlines(),1) if re.search(pat,line)]
p=Path('client/src/styles/pages/person.css');s=p.read_text();results['person-important']=len(re.findall('!important',s));results['person-device-prefix']=len(re.findall(r'\.device\s',s));results['old-public-only-selectors']=[str(p) for p in [Path('client/src/styles.css'),Path('client/src/fidelity.css'),Path('client/src/ProfileFlow.legacy-1.css')] if re.search(r'\.(?:d4-public-actions|d4-cards)|#public-|#safety-',p.read_text())]
results['script-unchanged']=Path('client/src/components/ProfileFlow.vue').read_text().split('</script>')[0]==subprocess.check_output(['git','show','96ee3bd:client/src/components/ProfileFlow.vue'],text=True).split('</script>')[0]
results['protected-flow-diff']=subprocess.check_output(['git','diff','--name-only','--','client/src/components/HomeFlow.vue','client/src/components/LettersFlow.vue','client/src/components/InboxFlow.vue','client/src/components/ChatFlow.vue','client/src/components/AuthFlow.vue'],text=True).splitlines()
results['note']='R17/R18 generic rules in old files explicitly exclude .person-page. They are retained to avoid changing own-profile and avatar editing.'
Path('client/docs/ui-redo/r16/architecture.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
