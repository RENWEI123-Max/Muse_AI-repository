import json
j=json.load(open('/root/maugo-figma/maugo-file-full.json'))
ids=['29:10251','29:10389','29:10524','29:10678','29:10758','29:10845','29:10933','29:11085']; out={}
def walk(n):
 if n.get('id') in ids:out[n['id']]=n
 for c in n.get('children',[]):walk(c)
walk(j['document'])
json.dump(out,open('client/docs/ui-redo/r12/figma-nodes.json','w'),ensure_ascii=False,indent=2)
f=open('client/docs/ui-redo/r12/measurements.txt','w')
for id,n in out.items():
 b=n['absoluteBoundingBox']; f.write('\n'+n['name']+' '+id+'\n')
 def dump(c,d=0):
  bb=c.get('absoluteBoundingBox',{}); data={k:c[k] for k in ['effects','visible','characters','layoutMode','counterAxisSpacing','fills','strokes','cornerRadius','rectangleCornerRadii','style','paddingLeft','paddingRight','paddingTop','paddingBottom','itemSpacing','opacity'] if k in c}
  if bb: f.write(' '*d+c['id']+' '+c['name']+' '+str([round(bb['x']-b['x'],2),round(bb['y']-b['y'],2),round(bb['width'],2),round(bb['height'],2)])+' '+json.dumps(data,ensure_ascii=False)+'\n')
  for x in c.get('children',[]):dump(x,d+1)
 dump(n)
