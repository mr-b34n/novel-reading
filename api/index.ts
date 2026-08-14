import express, { Request, Response, NextFunction } from 'express'
import { aliceswRouter } from '../src/server/routes.js'

const app = express()

app.use(express.json())

// Enable CORS for Vercel Serverless Function
app.use((_req: Request, res: Response, next: NextFunction) => {
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
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({ status: 'ok', source: 'alicesw-reader' })
})

// Mount AliceSW routes for both /api/source/alicesw and /source/alicesw
app.use(['/api/source/alicesw', '/source/alicesw'], aliceswRouter)

export default app
