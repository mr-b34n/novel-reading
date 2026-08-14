import express from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import { aliceswRouter } from './src/server/routes'

export const app = express()
const PORT = 3000

app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', source: 'alicesw-reader' })
})

// Mount AliceSW routes
app.use('/api/source/alicesw', aliceswRouter)

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
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NovReader Server running on http://0.0.0.0:${PORT}`)
  })
}

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  startServer()
}

export default app
