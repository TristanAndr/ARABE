/**
 * Build de production sous un sous-chemin GitHub Pages : toutes les ressources doivent
 * pointer sous /NOM-DU-REPO/, sinon la page publiée reste blanche.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { afterAll, describe, expect, it } from 'vitest'
import { basePath } from '../vite.config'

const out = mkdtempSync(join(tmpdir(), 'qiraa-build-'))
afterAll(() => rmSync(out, { recursive: true, force: true }))

describe('sous-chemin de publication', () => {
  it('normalise BASE_PATH', () => {
    expect(basePath(undefined)).toBe('/')
    expect(basePath('')).toBe('/')
    expect(basePath('qiraa')).toBe('/qiraa/')
    expect(basePath('/qiraa/')).toBe('/qiraa/')
  })

  it('le build référence les ressources sous le sous-chemin', async () => {
    await build({
      root: join(__dirname, '..'),
      base: '/depot-test/',
      logLevel: 'silent',
      build: { outDir: out, emptyOutDir: true },
    })
    const html = readFileSync(join(out, 'index.html'), 'utf8')
    const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]!)
    expect(refs.length).toBeGreaterThan(1)
    for (const ref of refs) expect(ref.startsWith('/depot-test/'), ref).toBe(true)

    const css = readdirSync(join(out, 'assets')).filter((f) => f.endsWith('.css'))
    const fonts = [...readFileSync(join(out, 'assets', css[0]!), 'utf8').matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]!)
    for (const f of fonts) expect(f.startsWith('/depot-test/') || !f.startsWith('/'), f).toBe(true)
  }, 60_000)
})
