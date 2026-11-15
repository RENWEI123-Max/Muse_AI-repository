// Derived historical comparisons only. No navigation, mocked state or substitute screenshots.
import {chromium} from '@playwright/test'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
const out=new URL('./',import.meta.url),rows=JSON.parse(await readFile(new URL('total-input.json',out),'utf8'))
await mkdir(new URL('total/',out),{recursive:true})
const b=await chromium.launch(),p=await b.newPage();
await p.setContent('<canvas width="750" height="812"></canvas>')
for(const row of rows){
 if(!row.actual)continue
 try{
  const a=execFileSync('git',['show','27c74f5:'+row.actual],{maxBuffer:10*1024*1024}),r=await readFile(new URL('../../design-reference/figma/'+row.id+'.png',out))
  const result=await p.evaluate(async({a,r})=>{
   const load=async s=>{const i=new Image();i.src='data:image/png;base64,'+s;await i.decode();return i},[i,j]=await Promise.all([load(a),load(r)])
   if(i.width!==375||i.height!==812||j.width!==375||j.height!==812)return {error:`dimension mismatch actual=${i.width}x${i.height} reference=${j.width}x${j.height}`}
   const c=document.querySelector('canvas'),x=c.getContext('2d');x.clearRect(0,0,750,812);x.drawImage(j,0,0);x.drawImage(i,375,0)
   const aa=x.getImageData(0,0,375,812).data,bb=x.getImageData(375,0,375,812).data;let n=0
   for(let k=0;k<aa.length;k+=4)if(aa[k]!==bb[k]||aa[k+1]!==bb[k+1]||aa[k+2]!==bb[k+2]||aa[k+3]!==bb[k+3])n++
   return {differentPixels:n,totalPixels:375*812,percent:n/(375*812)*100,side:c.toDataURL().split(',')[1]}
  },{a:a.toString('base64'),r:r.toString('base64')})
  if(result.side){await writeFile(new URL('total/'+row.id+'-side-by-side.png',out),Buffer.from(result.side,'base64'));delete result.side;row.composite='r25/total/'+row.id+'-side-by-side.png'}
  Object.assign(row,result)
 }catch(e){row.error=String(e)}
}
await writeFile(new URL('total-comparison.json',out),JSON.stringify(rows,null,2)+'\n');await b.close();console.log('measured',rows.filter(x=>x.percent!==undefined).length,'missing',rows.filter(x=>x.percent===undefined).length)
