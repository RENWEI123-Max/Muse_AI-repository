import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const root = new URL('../src/assets/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('asset-manifest.json', root)))
assert.equal(manifest.assetCount, 343)
assert.equal(manifest.assets.length, 343)
const pngs = readdirSync(root, { recursive: true }).filter(p => p.endsWith('.png'))
assert.equal(pngs.length, 343)
assert.equal(new Set(manifest.assets.map(a => a.name)).size, 343)
for (const entry of manifest.assets) {
  const file = entry.file.replace(/^png-1x\//, '')
  assert(!file.includes('..'))
  const bytes = readFileSync(new URL(file, root))
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', file)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, file)
  assert.equal(bytes.readUInt32BE(16), entry.w, file)
  assert.equal(bytes.readUInt32BE(20), entry.h, file)
}
for (const font of ['Fredoka', 'GowunDodum']) {
  assert(readFileSync(new URL(`fonts/${font}.ttf`, root)).length > 0)
  assert(readFileSync(new URL(`fonts/${font}-OFL.txt`, root), 'utf8').includes('SIL OPEN FONT LICENSE'))
}
console.log('PASS: 343 PNGs; manifest paths, SHA256, dimensions, fonts and OFL licenses')
