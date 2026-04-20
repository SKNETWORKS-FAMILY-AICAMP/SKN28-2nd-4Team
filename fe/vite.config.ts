import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const projectRoot = __dirname
  const env = loadEnv(mode, projectRoot, '')

  return {
    root: projectRoot,
    envDir: projectRoot,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/health': {
          target: env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
