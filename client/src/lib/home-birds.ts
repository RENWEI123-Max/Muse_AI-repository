import type { ObjectDirective } from 'vue'

type Motion = { enabled: boolean; refreshing: boolean; paused: boolean; letters: string }
type Run = { update: (value: Motion) => void; stop: () => void }
const runs = new WeakMap<HTMLElement, Run>()
const specs = [
 { path: 'M188 459 C181 418 145 388 119 369 C101 356 94 350 98 343', end: [98,343], delay:620, duration:1690, seed:1.4 },
 { path: 'M188 459 C201 392 151 357 166 309 C178 278 194 259 202 242', end:[202,242], delay:410, duration:2070, seed:.3 },
 { path: 'M188 459 C192 414 229 378 254 363 C276 353 284 351 279 344', end:[279,344], delay:830, duration:1730, seed:2.5 }
]
const clamp=(v:number)=>Math.min(1,Math.max(0,v))
const smooth=(t:number)=>t*t*t*(t*(t*6-15)+10)

// Only presentation: final boxes remain the approved Figma boxes.
export const vHomeBirds: ObjectDirective<HTMLElement, Motion> = {
 mounted(el,binding){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)')
  const paths=specs.map(s=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',s.path);return p})
  let value=binding.value,elapsed=0,previous=performance.now(),frame=0
  const reset=()=>el.querySelectorAll<HTMLElement>('.letter-bird').forEach(b=>{b.style.removeProperty('transform');b.style.removeProperty('opacity')})
  const paint=()=>{
   if(!value.enabled||reduced.matches){reset();return}
   el.querySelectorAll<HTMLElement>('.letter-bird').forEach((bird,i)=>{
    const s=specs[i%3]!,p=paths[i%3]!,u=clamp((elapsed-s.delay)/s.duration),q=smooth(u),point=p.getPointAtLength(p.getTotalLength()*q)
    const h=Math.max(0,(elapsed-s.delay-s.duration)/1000),k=1-Math.exp(-h*3)
    let x=point.x,y=point.y,angle=0
    if(u<1){const next=p.getPointAtLength(p.getTotalLength()*Math.min(1,q+.004));angle=Math.max(-19,Math.min(19,Math.atan2(next.x-x,-(next.y-y))*180/Math.PI*.19))}
    else{x+=Math.sin(h*1.4+s.seed)*3*k;y+=Math.sin(h*1.85+s.seed)*4*k;angle=Math.sin(h*1.45+s.seed)*3*k}
    bird.style.transform=`translate(${x-s.end[0]!}px,${y-s.end[1]!}px) rotate(${angle}deg) scale(${.24+.76*smooth(clamp(u*1.45))})`
    bird.style.opacity=String(u>0?clamp(u/.13):0)
   })
  }
  const tick=(now:number)=>{if(!value.paused&&!document.hidden)elapsed+=Math.min(now-previous,70);previous=now;paint();frame=requestAnimationFrame(tick)}
  runs.set(el,{update(next){if(next.letters!==value.letters||(!next.refreshing&&value.refreshing))elapsed=0;value=next;paint()},stop(){cancelAnimationFrame(frame);reset()}})
  paint();frame=requestAnimationFrame(tick)
 },
 updated(el,binding){runs.get(el)?.update(binding.value)},
 beforeUnmount(el){runs.get(el)?.stop();runs.delete(el)}
}
