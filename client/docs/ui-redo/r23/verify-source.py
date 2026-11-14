import json,re,subprocess
from pathlib import Path
p=Path('client/src/components/SettingsFlow.vue');s=p.read_text();old=subprocess.check_output(['git','show','bd9fea6:'+str(p)],text=True)
script=lambda x:x.split('<script setup lang="ts">')[1].split('</script>')[0]
files=['client/src/styles/pages/support.css','client/src/styles/pages/settings.css']
allcss=list(Path('client/src').rglob('*.css'));hexes=[str(p) for p in allcss if p.name!='tokens.css' and re.search(r'#[0-9a-fA-F]{3,8}\b',p.read_text())]
refs=set(re.findall(r'var\((--[\w-]+)',Path(files[0]).read_text()));defs=set(re.findall(r'(--[\w-]+)\s*:',Path('client/src/styles/tokens.css').read_text()))
r={'scriptUnchanged':script(s)==script(old),'idsRetained':set(re.findall(r'\bid="([^"]+)"',old))<=set(re.findall(r'\bid="([^"]+)"',s)),'supportHexLiterals':len(re.findall(r'#[0-9a-fA-F]{3,8}\b',Path(files[0]).read_text())),'supportImportant': '!important' in Path(files[0]).read_text(),'supportDevicePrefix':'.device ' in Path(files[0]).read_text(),'undefinedSupportTokens':sorted(refs-defs),'existingOtherCssFilesWithHex':hexes,'legalContentUnchanged':subprocess.run(['git','diff','--quiet','bd9fea6','--','client/src/lib/support-content.ts']).returncode==0}
Path('client/docs/ui-redo/r23/source-checks.json').write_text(json.dumps(r,indent=2));print(r)
