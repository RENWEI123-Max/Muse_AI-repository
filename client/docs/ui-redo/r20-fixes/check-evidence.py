import hashlib,json,pathlib,re,struct,subprocess,zlib
root=pathlib.Path(__file__).resolve().parents[3]
out=root/'docs/ui-redo/r20-fixes'
base='06d02b3'
def git(*args):return subprocess.check_output(['git',*args],cwd=root.parent,text=True)
protected=['client/src/styles/tokens.css','client/src/App.vue','client/src/lib/api.ts']
checks={p:git('show',base+':'+p)==(root.parent/p).read_text() for p in protected}
assert all(checks.values())
css=[root/'src/styles/pages'/n for n in ['home.css','appearance.css','chat.css','moments.css','reply.css','profile.css']]
style=(root/'src/components/UiToast.vue').read_text().split('<style scoped>')[1].split('</style>')[0]
a5={name:sum(len(re.findall(pattern,p.read_text())) for p in css)+len(re.findall(pattern,style)) for name,pattern in [('hex',r'#[0-9a-fA-F]{3,8}\b'),('important',r'!important'),('device',r'\.device\b')]}
assert all(v==0 for v in a5.values()),a5
files={n:(root/'src/components'/n).read_text() for n in ['ProfileFlow.vue','MomentsFlow.vue']}
guards={'person Escape':'@keydown.esc="person && $event.stopPropagation();back()"' in files['ProfileFlow.vue'],'own capture Escape':"['likes','gallery','archive','remove','crop'].includes(sheet)" in files['ProfileFlow.vue'],'cards esc.stop':'class="cards-overlay"' in files['MomentsFlow.vue'] and '@keydown.esc.stop="back"' in files['MomentsFlow.vue'],'moments esc.stop':'class="moments-overlay"' in files['MomentsFlow.vue'] and '@keydown.esc.stop="back"' in files['MomentsFlow.vue'],'list Retry':"act(()=>loadPosts())" in files['MomentsFlow.vue'],'toast timer':'},2700)' in (root/'src/components/UiToast.vue').read_text(),'JPEG preparation':"1600/Math.max" in (root/'src/lib/photo.ts').read_text() and "'image/jpeg',.88" in (root/'src/lib/photo.ts').read_text()}
assert all(guards.values()),guards
assert not git('diff',base,'--name-only','--','maugo').strip()
bundles=[{'file':str(p.relative_to(root)), 'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in (root/'dist/assets').glob('index-*')]
images=[]
for p in sorted(out.rglob('*.png')):
 b=p.read_bytes();assert b[:8]==b'\x89PNG\r\n\x1a\n',p
 at=8
 while at<len(b):
  size=int.from_bytes(b[at:at+4],'big');kind=b[at+4:at+8];chunk=b[at+8:at+8+size];crc=int.from_bytes(b[at+8+size:at+12+size],'big');assert zlib.crc32(kind+chunk)&0xffffffff==crc,p;at+=size+12
 w,h=struct.unpack('>II',b[16:24]);assert w==375 and h in [667,812],(p,w,h)
 images.append({'file':str(p.relative_to(out)),'width':w,'height':h,'sha256':hashlib.sha256(b).hexdigest()})
(out/'screenshots.json').write_text(json.dumps(images,indent=2)+'\n')
(out/'architecture.json').write_text(json.dumps({'base':base,'protected':checks,'A5_changed_page_styles_and_toast':a5,'guards':guards,'backendChanged':False,'bundles':bundles,'pngCount':len(images)},indent=2)+'\n')
(out/'evidence-index.md').write_text('# R20 fixes screenshots\n\n375×667 / 375×812; en / ko. guest-red.png, purchase-debug.png and heading-wrap-red.png are failed baselines, not final evidence.\n\n'+''.join('- ['+i['file']+']('+i['file']+')\n' for i in images))
print(json.dumps({'protected':checks,'A5':a5,'guards':guards,'bundles':bundles,'pngCount':len(images)},indent=2))
