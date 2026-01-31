import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      entry: 'src/index.tsx'
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
