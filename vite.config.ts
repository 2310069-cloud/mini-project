import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'
import net from 'net'
import { handleBackendApi } from './src/server/backendMiddleware'

function socBackendPlugin(): Plugin {
  return {
    name: 'soc-backend-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          return handleBackendApi(req, res, next)
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          return handleBackendApi(req, res, next)
        }
        next()
      })
    }
  }
}

/**
 * Dual-port forwarder:
 * Vite listens natively on port 3001.
 * This forwarder listens on port 3000 and forwards to 3001 with robust error handling.
 */
function dualPortProxyPlugin(): Plugin {
  let proxyServer: http.Server | null = null
  return {
    name: 'dual-port-proxy-3000',
    configureServer(server) {
      server.httpServer?.on('listening', () => {
        if (!proxyServer) {
          proxyServer = http.createServer((req, res) => {
            const options = {
              hostname: '127.0.0.1',
              port: 3001,
              path: req.url,
              method: req.method,
              headers: req.headers
            }
            const proxyReq = http.request(options, (proxyRes) => {
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
              proxyRes.pipe(res, { end: true })
            })
            proxyReq.on('error', () => {
              res.writeHead(502, { 'Content-Type': 'text/plain' })
              res.end('Proxy connecting to AdaptiveSOC on port 3001...')
            })
            req.pipe(proxyReq, { end: true })
          })

          proxyServer.on('upgrade', (req, socket, head) => {
            socket.on('error', () => {})
            const proxySocket = net.connect(3001, '127.0.0.1', () => {
              proxySocket.write(head)
              socket.pipe(proxySocket).pipe(socket)
            })
            proxySocket.on('error', () => {
              try { socket.destroy() } catch {}
            })
          })

          proxyServer.listen(3000, '0.0.0.0', () => {
            console.log('[AdaptiveSOC] Port forwarder active: http://localhost:3000 -> http://localhost:3001')
          })
          proxyServer.on('error', (err: any) => {
            console.log('[AdaptiveSOC] Port 3000 forwarder note:', err.message)
          })
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), socBackendPlugin(), dualPortProxyPlugin()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200
  },
  server: {
    host: '0.0.0.0',
    port: 3001
  },
  preview: {
    host: '0.0.0.0',
    port: 3001
  }
})
