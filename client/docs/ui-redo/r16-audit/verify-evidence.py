from pathlib import Path
import json,hashlib,struct
out=Path(__file__).parent
states=['person-profile','person-waiting','person-followed','person-no-content','person-photo','person-safety']
images=[]
for p in sorted(out.glob('*.png')):
 data=p.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n';w,h=struct.unpack('>II',data[16:24]);assert w==375 and h==int(p.name.split('-')[0]);images.append({'file':p.name,'width':w,'height':h,'sha256':hashlib.sha256(data).hexdigest()})
for height in [667,812]:
 for lang in ['en','ko']:
  for state in states:assert (out/f'{height}-{lang}-{state}.png').exists()
  j=json.loads((out/f'{height}-{lang}-walkthrough.json').read_text());c=json.loads((out/f'{height}-{lang}-checks.json').read_text())
  assert j['fixture'] and not j['errors'] and not c['checks']['clipped'];assert c['checks']['body']['top']>0 and c['checks']['cards']['left']>0
  for r in j['records']:
   assert r['document']=={'height':height,'y':0,'width':375}
   assert not any(x['clipped'] for x in r['copy']);assert all(x['decoded'] for x in r['images'])
  assert not any(x['method']!='GET' and x['path'].startswith(('/reports','/blocks')) for x in j['calls'])
(out/'screenshots.json').write_text(json.dumps(images,indent=2))
(out/'evidence-index.md').write_text('# R16 API fixture screenshots\n\nReal browser PNGs; mock API and local repository media, not production data or Figma exports.\n\n'+'\n'.join(f"- [{x['file']}]({x['file']})" for x in images)+'\n')
print(f'PASS: {len(images)} PNGs; six states × two languages × two heights; no document scroll, clipping, undecoded images or safety mutation requests in captured records.')
