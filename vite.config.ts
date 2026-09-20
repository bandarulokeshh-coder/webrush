import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep the initial bundle lean: motion + lucide-react ship in their own
    // chunk so the receipt grid paints before the animation runtime arrives.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/motion')) return 'motion';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          return undefined;
        },
      },
    },
  },
})
