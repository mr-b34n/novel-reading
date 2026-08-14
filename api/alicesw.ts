import type { Request, Response } from 'express'
import {
  parseAliceHome,
  parseAliceCategory,
  parseAliceRank,
  parseAliceSearch,
  parseAliceNovel,
  parseAliceChapters,
  parseAliceChapterContent,
} from '../src/server/aliceswScraper'

/**
 * Serverless Function Handler for AliceSW
 * Compatible with Vercel / Netlify / Cloudflare / Node.js Serverless Functions
 *
 * Usage:
 *   /api/alicesw?action=home
 *   /api/alicesw?action=category&id=64&order=update_time+desc&page=1
 *   /api/alicesw?action=rank&type=hits_day
 *   /api/alicesw?action=search&q=keyword&type=_all
 *   /api/alicesw?action=novel&id=52807
 *   /api/alicesw?action=chapters&id=52807
 *   /api/alicesw?action=chapter&url=...
 */
export default async function handler(req: Request, res: Response) {
  // Enable CORS for serverless calls
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { action, id, url, q, type, order, page } = req.query as Record<string, string>
  const pageNum = parseInt(page || '1', 10)

  try {
    switch (action) {
      case 'home': {
        const data = await parseAliceHome()
        return res.status(200).json({ success: true, data })
      }

      case 'category': {
        const catId = id || '64'
        const catOrder = order || 'update_time+desc'
        const data = await parseAliceCategory(catId, catOrder, pageNum)
        return res.status(200).json({ success: true, data })
      }

      case 'rank': {
        const rankType = type || 'hits_day'
        const data = await parseAliceRank(rankType, pageNum)
        return res.status(200).json({ success: true, data })
      }

      case 'search': {
        if (!q || !q.trim()) {
          return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm (q)' })
        }
        const searchType = type || '_all'
        const data = await parseAliceSearch(q.trim(), searchType, pageNum)
        return res.status(200).json({ success: true, data })
      }

      case 'novel': {
        const novelTarget = id || url
        if (!novelTarget) {
          return res.status(400).json({ success: false, error: 'Thiếu ID hoặc URL truyện' })
        }
        const data = await parseAliceNovel(novelTarget)
        return res.status(200).json({ success: true, data })
      }

      case 'chapters': {
        const novelTarget = id || url
        if (!novelTarget) {
          return res.status(400).json({ success: false, error: 'Thiếu ID hoặc URL truyện' })
        }
        const data = await parseAliceChapters(novelTarget)
        return res.status(200).json({ success: true, data })
      }

      case 'chapter': {
        if (!url) {
          return res.status(400).json({ success: false, error: 'Thiếu URL chương truyện' })
        }
        const data = await parseAliceChapterContent(url)
        return res.status(200).json({ success: true, data })
      }

      default:
        return res.status(400).json({
          success: false,
          error: 'Action không hợp lệ. Chọn: home, category, rank, search, novel, chapters, chapter',
        })
    }
  } catch (error: any) {
    console.error('Serverless AliceSW Handler Error:', error)
    return res.status(500).json({ success: false, error: error.message || 'Lỗi serverless function' })
  }
}
