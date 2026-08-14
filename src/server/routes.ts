import { Router, Request, Response } from 'express'
import {
  parseAliceHome,
  parseAliceCategory,
  parseAliceRank,
  parseAliceSearch,
  parseAliceNovel,
  parseAliceChapters,
  parseAliceChapterContent,
  normalizeImgUrl,
} from './aliceswScraper'

export const aliceswRouter = Router()

// GET /api/source/alicesw/home
aliceswRouter.get('/home', async (_req: Request, res: Response) => {
  try {
    const data = await parseAliceHome()
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in /api/source/alicesw/home:', error)
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tải trang chủ AliceSW' })
  }
})

// GET /api/source/alicesw/category?id=64&order=update_time+desc&page=1
aliceswRouter.get('/category', async (req: Request, res: Response) => {
  try {
    const id = (req.query.id as string) || '64'
    const order = (req.query.order as string) || 'update_time+desc'
    const page = parseInt((req.query.page as string) || '1', 10)

    const data = await parseAliceCategory(id, order, page)
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in /api/source/alicesw/category:', error)
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tải thể loại AliceSW' })
  }
})

// GET /api/source/alicesw/rank?type=hits_day&page=1
aliceswRouter.get('/rank', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'hits_day'
    const page = parseInt((req.query.page as string) || '1', 10)

    const data = await parseAliceRank(type, page)
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in /api/source/alicesw/rank:', error)
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tải bảng xếp hạng AliceSW' })
  }
})

// GET /api/source/alicesw/search?q=keyword&type=_all&page=1
aliceswRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || ''
    const type = (req.query.type as string) || '_all'
    const page = parseInt((req.query.page as string) || '1', 10)

    if (!q.trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm (q)' })
    }

    const data = await parseAliceSearch(q.trim(), type, page)
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in /api/source/alicesw/search:', error)
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tìm kiếm trên AliceSW' })
  }
})

// GET /api/source/alicesw/novel?id=52807 or ?url=https://www.alicesw.com/novel/52807.html
aliceswRouter.get('/novel', async (req: Request, res: Response) => {
  try {
    const idOrUrl = (req.query.id as string) || (req.query.url as string) || ''
    if (!idOrUrl.trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu ID hoặc URL truyện' })
    }

    const data = await parseAliceNovel(idOrUrl.trim())
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in /api/source/alicesw/novel:', error)
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tải thông tin truyện từ AliceSW' })
  }
})

// GET /api/source/alicesw/chapters?id=52807 or ?url=...
aliceswRouter.get('/chapters', async (req: Request, res: Response) => {
  try {
    const idOrUrl = (req.query.id as string) || (req.query.url as string) || ''
    if (!idOrUrl.trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu ID hoặc URL truyện' })
    }

    const data = await parseAliceChapters(idOrUrl.trim())
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in /api/source/alicesw/chapters:', error)
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tải mục lục chương' })
  }
})

// GET /api/source/alicesw/chapter?url=https://www.alicesw.com/book/...
aliceswRouter.get('/chapter', async (req: Request, res: Response) => {
  try {
    const url = (req.query.url as string) || ''
    if (!url.trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu URL chương truyện' })
    }

    const data = await parseAliceChapterContent(url.trim())
    res.json({ success: true, data })
  } catch (error: any) {
    console.error('Error in /api/source/alicesw/chapter:', error)
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tải nội dung chương' })
  }
})

// GET /api/source/alicesw/proxy-image?url=...
aliceswRouter.get('/proxy-image', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string
    if (!url) {
      return res.status(400).send('Missing url parameter')
    }
    const targetUrl = normalizeImgUrl(url)
    const imgRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://www.alicesw.com/',
      },
    })
    if (!imgRes.ok) {
      return res.status(imgRes.status).send('Failed to fetch image')
    }
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    const buffer = await imgRes.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (error: any) {
    res.status(500).send(error.message)
  }
})
