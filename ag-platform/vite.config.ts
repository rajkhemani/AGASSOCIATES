import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Lighthouse performance budget targets:
//   LCP < 2.0s
//   TBT < 200ms
//   CLS < 0.05
//   JS bundle < 300KB gzipped

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
