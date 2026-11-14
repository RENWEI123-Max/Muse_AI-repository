import json
j=json.load(open('/root/maugo-figma/maugo-file-full.json'))
ids=['29:8643','29:8737','29:8830','29:8952','29:9074','29:9202','29:9333','29:9459','29:9689','29:9815','29:9971','29:10127']; out={}
def walk(n):
 if n.get('id') in ids:out[n['id']]=n
 for c in n.get('children',[]):walk(c)
walk(j['document'])
json.dump(out,open('client/docs/ui-redo/r11/figma-nodes.json','w'),ensure_ascii=False,indent=2)
f=open('client/docs/ui-redo/r11/measurements.txt','w')
for id,n in out.items():
 b=n['absoluteBoundingBox']; f.write('\n'+n['name']+' '+id+'\n')
 def dump(c,d=0):
  bb=c.get('absoluteBoundingBox',{}); data={k:c[k] for k in ['fills','strokes','cornerRadius','rectangleCornerRadii','style','paddingLeft','paddingRight','paddingTop','paddingBottom','itemSpacing','opacity'] if k in c}
  if bb: f.write(' '*d+c['id']+' '+c['name']+' '+str([round(bb['x']-b['x'],2),round(bb['y']-b['y'],2),round(bb['width'],2),round(bb['height'],2)])+' '+json.dumps(data,ensure_ascii=False)+'\n')
  for x in c.get('children',[]):dump(x,d+1)
 dump(n)
