import {chromium} from '@playwright/test'
import {readFile,writeFile} from 'node:fs/promises'
const b=await chromium.launch(),p=await b.newPage({viewport:{width:750,height:812}}),out=new URL('./',import.meta.url),rows=[]
for(const id of ['wallet-empty','topup-confirm','pass-default','pass-one-day','pass-month','pass-shortage','pass-sheet']){
const actual=await readFile(new URL(`812-en-${id}.png`,out)),ref=await readFile(new URL(`../../design-reference/figma/${id}.png`,out))
await p.setContent('<canvas width="750" height="812"></canvas>')
const ratio=await p.evaluate(async({a,r})=>{const load=s=>new Promise(resolve=>{const i=new Image;i.onload=()=>resolve(i);i.src=s}),[i,j]=await Promise.all([load(a),load(r)]),c=document.querySelector('canvas'),x=c.getContext('2d');x.drawImage(i,0,0);x.drawImage(j,375,0);const aa=x.getImageData(0,0,375,812).data,bb=x.getImageData(375,0,375,812).data;let n=0;for(let k=0;k<aa.length;k+=4)if(aa.slice(k,k+4).some((v,o)=>v!==bb[k+o]))n++;return n/(375*812)},{a:'data:image/png;base64,'+actual.toString('base64'),r:'data:image/png;base64,'+ref.toString('base64')})
await p.screenshot({path:new URL(`${id}-side-by-side.png`,out).pathname});rows.push({state:id,differenceRatio:ratio})
}
await writeFile(new URL('comparison.json',out),JSON.stringify(rows,null,2));await b.close()
