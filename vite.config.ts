import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/zen-ui.ts',
      formats: ['es'],
      fileName: 'zen-ui',
    },
    outDir: 'dist',
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
