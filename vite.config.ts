import { defineConfig } from 'vite'
import pkg from './package.json'

export default defineConfig({
  root: 'web',
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    lib: {
      entry: '../plugin/zen-ui.ts',
      formats: ['es'],
      fileName: 'zen-ui',
    },
    outDir: '../dist',
    rollupOptions: {
      external: [
        // Do not externalize lit, we want to bundle it so the card works standalone
        // 'lit', 'lit/decorators.js'
      ],
      output: {
        entryFileNames: 'zen-ui.js',
      },
    },
  },
})
