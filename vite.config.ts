/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Sous-chemin de publication. GitHub Pages sert un dépôt de projet sous /NOM-DU-REPO/ :
 * le workflow de déploiement fournit BASE_PATH à partir du nom réel du dépôt.
 * En local (dev, preview) : racine.
 */
export function basePath(raw = process.env.BASE_PATH): string {
  const trimmed = (raw ?? '').trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

export default defineConfig({
  base: basePath(),
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'supabase/**/*.test.ts'],
    testTimeout: 15_000,
  },
})
