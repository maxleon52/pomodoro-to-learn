import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { copyFileSync, mkdirSync, existsSync, readdirSync, renameSync } from 'node:fs'

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      // manifest
      copyFileSync('manifest.json', 'dist/manifest.json')

      // move sidepanel HTML to dist root (manifest expects sidepanel.html)
      const htmlSrc = 'dist/src/sidepanel/index.html'
      if (existsSync(htmlSrc)) {
        renameSync(htmlSrc, 'dist/sidepanel.html')
      }

      // icons
      const iconsDir = 'public/icons'
      if (existsSync(iconsDir)) {
        mkdirSync('dist/icons', { recursive: true })
        readdirSync(iconsDir).forEach((f: string) =>
          copyFileSync(`${iconsDir}/${f}`, `dist/icons/${f}`)
        )
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyExtensionAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(import.meta.dirname, 'src/sidepanel/index.html'),
        background: resolve(import.meta.dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background.js'
          return 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
