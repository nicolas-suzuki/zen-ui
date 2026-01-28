import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/ha-calendar-heatmap.ts',
      formats: ['es'],
      fileName: 'ha-calendar-heatmap',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        // Do not externalize lit, we want to bundle it so the card works standalone
        // 'lit', 'lit/decorators.js'
      ],
      output: {
        entryFileNames: 'ha-calendar-heatmap.js',
      },
    },
  },
})
