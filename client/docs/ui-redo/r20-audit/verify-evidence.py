"""Verify existing browser PNGs and walkthroughs; never creates images or test data."""
import hashlib,json,pathlib,struct,zlib
out=pathlib.Path(__file__).resolve().parent
states=[p['id'] for p in json.load(open(out/'state-script.json'))['pages']]
shots=[]
for p in sorted(out.glob('*.png')):
 b=p.read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n',p
 pos=8;chunks=[]
 while pos<len(b):
  n=struct.unpack('>I',b[pos:pos+4])[0];kind=b[pos+4:pos+8];data=b[pos+8:pos+8+n];crc=struct.unpack('>I',b[pos+8+n:pos+12+n])[0]
  assert zlib.crc32(kind+data)&0xffffffff==crc,(p,kind)
  chunks.append(kind);pos+=12+n
  if kind==b'IHDR':w,h=struct.unpack('>II',data[:8])
 assert chunks[-1]==b'IEND' and pos==len(b),p
 expected=int(p.name.split('-')[0]);assert (w,h)==(375,expected),(p,w,h)
 # Inflate IDAT to ensure image data is intact, in addition to chunk CRC.
 pos=8;compressed=b''
 while pos<len(b):
  n=struct.unpack('>I',b[pos:pos+4])[0]
  if b[pos+4:pos+8]==b'IDAT':compressed+=b[pos+8:pos+8+n]
  pos+=12+n
 assert len(zlib.decompress(compressed))>0,p
 shots.append({'file':p.name,'width':w,'height':h,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'chunksCRC':'valid','compressedData':'valid'})
(out/'screenshots.json').write_text(json.dumps(shots,indent=2)+'\n')
groups=[]
for height in [667,812]:
 for lang in ['en','ko']:
  prefix=f'{height}-{lang}';d=json.load(open(out/f'{prefix}-walkthrough.json'));c=d['checks'];r=d['records']
  assert {x['name'] for x in r if x['primary']}==set(states)
  for state in states:assert (out/f'{prefix}-{state}.png').exists()
  assert all(x['doc']=={'height':height,'width':375,'y':0} for x in r)
  for state in ['options','post-visibility','moment-delete','moment-stickers','moment-visibility','compose-category','moment-leave']:
   assert c[state+'Escape']=={'profile':True,'page':True,'dialogs':0},(prefix,state)
  for key in ['keepRestored','fileCancel','stickerUploaded','textBoundary','attachmentBoundary','deleteCancelToList','visibilityPatched','discardCleared','backdropClose','whitespaceDisabled']:assert c[key],(prefix,key)
  assert not c['categoryEntry']['hit'],prefix
  assert c['reducedMotion']=={'animation':'none','transition':'0s'}
  for key in ['composeScroll','listScroll']:
   assert c[key]['top']>0 and c[key]['documentY']==0,(prefix,key,c[key])
  for key,scale in [('keepPress','0.96'),('deletePress','0.96'),('closePress','0.94')]:assert c[key]==f'matrix({scale}, 0, 0, {scale}, 0, 0)'
  assert not d['errors'],prefix
  for x in r:
   assert all(i['loaded'] for i in x['decoded']),(prefix,x['name'])
   m=x['metric']
   if not m:continue
   sticker=x['name']=='moment-stickers';dialog=x['name'] in ['moment-leave','moment-delete','delete-failure']
   assert m['animation']['name']==('none' if sticker else 'sheet-in'),(prefix,x['name'])
   assert m['animation']['duration']==('0s' if sticker else '0.22s' if dialog else '0.3s'),(prefix,x['name'])
   assert m['transition']=='0s'
   if x['entry']:
    assert x['entry']['transition']=='0s' and x['entry']['veilTransition']=='0s'
    for animation in x['entry']['animations']:
     frames=animation['keyframes'];assert frames[0]['transform']=='translateY(30px)' and frames[0]['opacity']=='0'
     assert frames[-1]['transform']=='none' and frames[-1]['opacity']=='1'
   if not sticker:assert m['animation']['timing']=='ease-out'
  assert d['initialPosts']==0
  assert sum(x['method']=='POST' and x['path']=='/posts' for x in d['calls'])==2 # failed attempt and actual UI publish
  groups.append({'group':prefix,'records':len(r),'screenshots':len([s for s in shots if s['file'].startswith(prefix+'-')]),'primaryStates':states,'composeScroll':c['composeScroll'],'listScroll':c['listScroll'],'stickerScroll':c['stickerScroll'],'escape':True,'categoryEntryClipped':not c['categoryEntry']['hit'],'horizontalClippingObserved':c['clipped'],'imagesDecoded':True,'animationsCaptured':sum(bool(x.get('entry') and x['entry']['animations']) for x in r),'apiCalls':len(d['calls']),'realBackendVerified':False})
assert len(shots)==sum(len(json.load(open(out/f'{h}-{l}-walkthrough.json'))['records']) for h in [667,812] for l in ['en','ko'])
log=(out/'walkthrough-final.log').read_text();assert '4 passed' in log and 'failed' not in log
architecture=json.load(open(out/'architecture.json'));assert architecture['escapeProtectionMatchesBase']
assert all(architecture[p]['scriptUnchanged'] for p in ['client/src/components/MomentsFlow.vue','client/src/components/ProfileFlow.vue'])
assert all(v==0 for v in architecture['A5CurrentScan'].values())
assert json.load(open(out/'state-crosscheck.json'))['count']==12
assert 'built in' in (out/'build-final.log').read_text()
result={'fixtureOnly':True,'overallAcceptance':'未通过／待 Smith','fourAcceptanceRows':{k:'未通过／待 Smith' for k in ['静态','流程','效果','滑动与文案']},'testResult':'4 passed','screenshots':len(shots),'primaryScreenshots':48,'pngDimensionsCRCAndInflation':'valid','groups':groups,'scriptsUnchanged':True,'escapeProtectionPreserved':True,'staticLegacyGaps':['A2','A3','A4'],'realBackendVerified':False,'fullTranslationVerified':False,'build':'build-final.log: exit 0 (shell command result)'}
(out/'evidence-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(out/'evidence-index.md').write_text('# R20 browser evidence\n\n'+ '\n'.join(f"- [{s['file']}]({s['file']}) — {s['width']}×{s['height']}" for s in shots)+'\n')
print(json.dumps({'screenshots':len(shots),'primaryScreenshots':48,'groups':[{k:v for k,v in g.items() if k not in ['primaryStates','horizontalClippingObserved']} for g in groups],'overallAcceptance':result['overallAcceptance']},ensure_ascii=False,indent=2))
