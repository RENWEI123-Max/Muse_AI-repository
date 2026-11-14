import json,hashlib,pathlib
src=pathlib.Path('/root/maugo-figma/maugo-file-full.json'); raw=src.read_bytes(); data=json.loads(raw)
ids=['35:'+str(i) for i in [2414,2470,2564,2658,2713,2769,2827,2891,2957,3025,3076,3130,3183,3228,3279,3332,3387,3439,3491]]; found={}
def walk(n):
 if n.get('id') in ids: found[n['id']]=n
 for c in n.get('children',[]):walk(c)
walk(data['document']); out=pathlib.Path(__file__).parent
(out/'figma-nodes.json').write_text(json.dumps(found,ensure_ascii=False,indent=2))
(out/'source.json').write_text(json.dumps({'path':str(src),'sha256':hashlib.sha256(raw).hexdigest(),'version':data.get('version'),'requestedVersion':'2421258509127695554'},indent=2))
lines=[]
for id,n in found.items():
 lines.append('\nSTATE '+id+' '+n['name']); origin=n['absoluteBoundingBox']
 def emit(c,d=0):
  b=c.get('absoluteBoundingBox',{}); b={k:round(v-(origin[k] if k in ['x','y'] else 0),3) for k,v in b.items()}
  attrs={k:c[k] for k in ['fills','strokes','cornerRadius','rectangleCornerRadii','style','itemSpacing','paddingLeft','paddingRight','paddingTop','paddingBottom','characters','effects'] if k in c}
  lines.append(' '*d+c['id']+' '+c['name']+' '+json.dumps(b)+' '+json.dumps(attrs,ensure_ascii=False))
  for ch in c.get('children',[]):emit(ch,d+1)
 emit(n)
(out/'figma-measurements.txt').write_text('\n'.join(lines))
