"""Verify existing browser PNGs and walkthroughs; never creates images or test data."""
import hashlib,json,pathlib,struct,zlib
out=pathlib.Path(__file__).resolve().parent
states=['card-type','card-options','card-preview','card-change-type','card-visibility','card-remove']
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
  for state in states:assert (out/f'{prefix}-{state}.png').exists()
  assert all(x['doc']=={'height':height,'width':375,'y':0} for x in r)
  assert all(c[s+'Escape']=={'profile':True,'dialogs':0} for s in states)
  assert c['preview']=={'width':309,'height':480,'loaded':True}
  if height==667:assert c['previewScroll']['top']>0
  assert c['gridScroll']['top']>0 and c['gridScroll']['documentY']==0
  assert c['deletePress']=='matrix(0.96, 0, 0, 0.96, 0, 0)'
  assert not d['errors']
  assert c['clipped']==[]
  for x in r:
   m=x['metric']
   if not m:continue
   assert m['animation']['name']=='sheet-in'
   assert m['animation']['duration']==('0.22s' if x['name'] in ['card-remove','delete-failure'] else '0.3s')
   assert m['animation']['timing']=='ease-out' and m['animation']['veilTransition']=='0s'
   assert m['scroll']['overflow']=='auto'
  groups.append({'group':prefix,'records':len(r),'screenshots':len([s for s in shots if s['file'].startswith(prefix+'-')]),'primaryStates':states,'gridScroll':c['gridScroll'],'previewScroll':c['previewScroll'],'escape':True,'copyHorizontalClipping':c['clipped'],'animationsCaptured':sum(bool(x.get('entry') and x['entry']['animations']) for x in r),'apiCalls':len(d['calls']),'realBackendVerified':False})
assert len(shots)==sum(len(json.load(open(out/f'{h}-{l}-walkthrough.json'))['records']) for h in [667,812] for l in ['en','ko'])
log=(out/'walkthrough-final.log').read_text();assert '4 passed' in log and 'failed' not in log
architecture=json.load(open(out/'architecture.json'));assert architecture['escapeProtectionMatchesBase'] and architecture['allOtherProductionFilesUnchanged']
assert all(architecture[p]['scriptUnchanged'] for p in ['client/src/components/MomentsFlow.vue','client/src/components/ProfileFlow.vue'])
assert all(all(v==0 for v in counts.values()) for counts in architecture['A5IncrementalCSSScan'].values())
result={'fixtureOnly':True,'overallAcceptance':'未通过／待 Smith','testResult':'4 passed','screenshots':len(shots),'primaryScreenshots':24,'pngDimensionsCRCAndInflation':'valid','groups':groups,'scriptsUnchanged':True,'escapeProtectionPreserved':True,'staticLegacyGaps':['A2','A3','A4'],'realBackendVerified':False,'fullTranslationVerified':False,'build':'build-final.log: exit 0 (shell command result)'}
(out/'evidence-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
(out/'evidence-index.md').write_text('# R19 browser evidence\n\n'+ '\n'.join(f"- [{s['file']}]({s['file']}) — {s['width']}×{s['height']}" for s in shots)+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
