import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('redux')) {
              return 'vendor';
            }
            if (
              id.includes('pdfjs-dist') ||
              id.includes('jspdf') ||
              id.includes('html2pdf') ||
              id.includes('@react-pdf-viewer') ||
              id.includes('pdf-lib')
            ) {
              return 'pdf-viewer';
            }
            if (id.includes('lucide-react') || id.includes('lucide')) {
              return 'ui-icons';
            }
          }
        },
      },
    },
  },
})
