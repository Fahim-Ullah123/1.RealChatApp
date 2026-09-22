import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Keep the existing local API address so login, Socket.IO, and calls use
  // the same backend they used before.
  const apiTarget = env.VITE_LOCAL_API_URL || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      // Keep the default development URL easy to open at localhost. Enable
      // HTTPS only when testing camera/microphone access on another device.
      host: true,
      port: 5173,
      // The backend allows this local origin. Do not silently move Vite to a
      // different port where Socket.IO can be rejected by CORS.
      strictPort: true,
      https: env.VITE_HTTPS === 'true',
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/socket.io': { target: apiTarget, changeOrigin: true, ws: true },
      },
    },
  }
})
