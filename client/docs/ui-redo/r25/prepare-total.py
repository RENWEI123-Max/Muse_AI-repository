import json,subprocess,re
from pathlib import Path
root=Path(__file__).resolve().parents[4]
groups=json.loads((root/'client/docs/design-reference/page-states.json').read_text())
tracked=subprocess.check_output(['git','ls-tree','-r','--name-only','27c74f5','client/docs'],cwd=root,text=True).splitlines()
tracked=[x for x in tracked if x.endswith('.png') and x.startswith('client/docs/') and '/design-reference/' not in x]
preferred={'entry':['r15-audit','r15'],'home':['r06-audit','r06','shell-fix'],'letters':['r08-audit','r08'],'inbox':['r09-audit','r09'],'reply-cost':['r10-audit','r10'],'chat':['r12-audit','r11-audit','r12','r11'],'appearance':['r13-audit','r13'],'safety':['r14-audit','r14'],'public-profile':['r16-audit','r16'],'profile':['r18-audit','r17-audit','r18','r17'],'image-cards':['r19-audit','r19'],'moments':['r20-audit','r20'],'settings':['r21'],'account':['r22-icon-fix','r22'],'support':['r23'],'diamonds':['r24']}
rows=[]
for g in groups:
 for state in g['pages']:
  sid=state['id'];candidates=[]
  for f in tracked:
   p=Path(f);stem=p.stem
   if any(x in stem for x in ['side-by-side','-diff','-reference','baseline','-ko','-small','667-','-bottom','-middle','-clipped']):continue
   if stem not in [sid,'812-en-'+sid,sid+'-actual'] and not stem.endswith('-'+sid):continue
   dirs=p.parts;folder=next((x for x in dirs if re.fullmatch(r'r\d+(?:-audit|-icon-fix)?',x)),'')
   score=100
   if folder in preferred[g['id']]:score=preferred[g['id']].index(folder)*5
   if stem=='812-en-'+sid:score-=2
   if len(dirs)>6:score+=30
   if '/test-results/' in f or '/regression-results/' in f:score+=100
   candidates.append((score,f))
  candidates.sort();actual=candidates[0][1] if candidates else None
  if actual and candidates[0][0]>=100:actual=None
  rows.append({'module':g['id'],'id':sid,'title':state['title'],'reference':'client/docs/design-reference/figma/'+sid+'.png','actual':actual,'status':'待 Smith' if g['id'] in ['settings','account','support','diamonds'] else '未验证','evidence':'历史证据重新测量；不是R25真实状态验收' if actual else '缺少明确对应的实现截图，不补图'})
# Explicit aliases reviewed against existing artifact names; historical provenance remains visible.
aliases={
 'home-ready':'r06-audit/812-en-03-ready-motion.png',
 'home-empty':'r06-audit/812-en-10-empty.png',
 'home-response':'r06-audit/812-en-01-response.png',
 'language-ko':'r21/812-ko-language-ko.png',
 **{sid:'screenshots/R07-'+sid+'.png' for sid in ['filters-free','filters-active','filters-selected','bird-female','bird-male','bird-motion-off']},
 **{sid:'r22-reverify/d7-'+sid+'.png' for sid in ['security','account-info','verification','pin-create','pin-invalid','pin-locked','pin-wrong','signout-confirm','signed-out','delete-disabled','delete-typed','delete-ready','delete-final']},
 **{sid:'r22-reverify/'+sid+'.png' for sid in ['privacy','privacy-visibility','privacy-only-me']}}
for row in rows:
 if row['id'] in aliases:
  actual='client/docs/ui-redo/'+aliases[row['id']]
  assert actual in tracked,actual
  row['actual']=actual;row['evidence']='Reviewed filename alias; historical evidence only, not R25 live acceptance'

out=root/'client/docs/ui-redo/r25';(out/'total-input.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print('states',len(rows),'candidate screenshots',sum(bool(x['actual']) for x in rows))
