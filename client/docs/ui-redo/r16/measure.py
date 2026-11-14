import json,collections
j=json.load(open('/root/maugo-figma/maugo-file-full.json')); ids=['29:12899','29:13023','29:13130','29:13254','29:13363','29:13500']; nodes={}
def walk(n):
 nodes[n['id']]=n
 for c in n.get('children',[]):walk(c)
walk(j['document']); out=[]
for id in ids:
 root=nodes[id]; b=root['absoluteBoundingBox']; rows=[]
 def rec(n,d=0):
  box=n.get('absoluteBoundingBox',{}); r={k:n[k] for k in ['id','name','type','characters','style','fills','strokes','effects','cornerRadius','layoutMode','itemSpacing','paddingLeft','paddingRight','paddingTop','paddingBottom','opacity'] if k in n};r['box']={k:round(v-(b[k] if k in ['x','y'] else 0),3) for k,v in box.items()};rows.append(r)
  print(' '*d,n['id'],n['type'],n.get('characters',n['name']),r['box'],n.get('cornerRadius',''),json.dumps(n.get('style',{})))
  for c in n.get('children',[]):rec(c,d+1)
 rec(root);out.append({'id':id,'name':root['name'],'elements':rows})
json.dump(out,open('client/docs/ui-redo/r16/figma-measurements.json','w'),ensure_ascii=False,indent=2)
