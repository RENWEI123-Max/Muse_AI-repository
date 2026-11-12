import manifest from '../assets/asset-manifest.json'
const files = import.meta.glob('../assets/**/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export const assets = manifest.assets.map(entry => {
  const path = entry.file.replace(/^png-1x\//, '')
  const url = files[`../assets/${path}`]
  if (!url) throw new Error(`Missing manifest asset: ${entry.name}`)
  return { ...entry, category: entry.name.split('/')[0]!, url }
})
const byName = new Map(assets.map(entry => [entry.name, entry.url]))
export function asset(name: string): string {
  const url = byName.get(name)
  if (!url) throw new Error(`Unknown asset: ${name}`)
  return url
}
export const assetCategories = [...new Set(assets.map(entry => entry.category))]
