// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Isolate heavy third-party libraries into dedicated cacheable vendor
        // chunks so cold-start and `/login` never download charts, rich-text
        // editors, map engines, or spreadsheet parsers upfront.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('highcharts')) return 'vendor-charts'
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-editor'
          if (id.includes('leaflet') || id.includes('@googlemaps')) return 'vendor-maps'
          if (id.includes('xlsx')) return 'vendor-xlsx'
          if (id.includes('datatables.net')) return 'vendor-datatables'
          if (id.includes('@iconify')) return 'vendor-icons'
        },
      },
    },
  },

  // The business app always runs on 5175 (PAYSOL.md §4, "Local ports"): the
  // backend's TENANT_APP_URL points owner emails here. strictPort makes Vite stop
  // with "port in use" instead of quietly moving to 5176.
  server: {
    port: 5175,
    strictPort: true,
  },
})
