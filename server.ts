import express from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import { aliceswRouter } from './src/server/routes.js'

export const app = express()
const PORT = 3000

app.use(express.json())

// Enable CORS for serverless & cross-origin requests
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (_req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
})

// Health check
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', source: 'alicesw-reader' })
})

// Mount AliceSW routes for both /api/source/alicesw and /source/alicesw
app.use(['/api/source/alicesw', '/source/alicesw'], aliceswRouter)

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NovReader Server running on http://0.0.0.0:${PORT}`)
  })
}

// Start server if run directly (and not in Vercel serverless environment)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer()
}

export default app
