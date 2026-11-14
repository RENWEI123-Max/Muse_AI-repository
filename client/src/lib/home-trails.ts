import type { ObjectDirective } from 'vue'

type SceneMotion = { enabled: boolean; refreshing: boolean; paused: boolean }
type TrailRun = { frame: number; stop: () => void; update: (value: SceneMotion) => void }
const runs = new WeakMap<SVGSVGElement, TrailRun>()
const specs = [{ delay: 620, duration: 1690 }, { delay: 410, duration: 2070 }, { delay: 830, duration: 1730 }]
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

// Presentation only. Copy the offline prototype's reveal/decay clock; never move birds.
export const vHomeTrails: ObjectDirective<SVGSVGElement, SceneMotion> = {
 mounted(el, binding) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let value = binding.value, elapsed = 0, previous = performance.now()
  const paths = [...el.querySelectorAll<SVGPathElement>('.home-trail')]
  const paint = () => paths.forEach((path, index) => {
   const spec = specs[index % 3]!
   const u = clamp((elapsed - spec.delay) / spec.duration)
   const alpha = !value.enabled || reduced.matches || u === 0 || elapsed >= spec.delay + spec.duration + 6600 ? 0
    : u < 1 ? .68 : .68 * Math.exp(-(elapsed - spec.delay - spec.duration) / 1100)
   path.style.strokeDasharray = `${smooth(u)} 1`
   path.style.opacity = String(alpha * (index < 3 ? .55 : 1))
  })
  const run: TrailRun = {
   frame: 0,
   stop() { cancelAnimationFrame(run.frame); reduced.removeEventListener('change', paint) },
   update(next) {
    if (next.refreshing && !value.refreshing) elapsed = 0
    value = next
    paint()
   }
  }
  const tick = (now: number) => {
   if (!value.paused && !document.hidden) elapsed += Math.min(now - previous, 70)
   previous = now
   paint()
   run.frame = requestAnimationFrame(tick)
  }
  paint()
  reduced.addEventListener('change', paint)
  run.frame = requestAnimationFrame(tick)
  runs.set(el, run)
 },
 updated(el, binding) { runs.get(el)?.update(binding.value) },
 beforeUnmount(el) { runs.get(el)?.stop(); runs.delete(el) }
}
