import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/socket.io': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
    allowedHosts: ['7cc9-172-56-170-26.ngrok-free.app'],
  },
  resolve: {
    alias: {
      '@public': resolve(__dirname, 'public'),
      '@': resolve(__dirname, 'src'),
    },
  },
})
