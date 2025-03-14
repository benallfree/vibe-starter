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
    allowedHosts: ['6433-172-56-168-170.ngrok-free.app'],
  },
  resolve: {
    alias: {
      '@public': resolve(__dirname, 'public'),
      '@': resolve(__dirname, 'src'),
    },
  },
})
