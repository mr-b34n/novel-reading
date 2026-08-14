import * as cheerio from 'cheerio'

const BASE_URL = 'https://www.alicesw.com'

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,vi;q=0.7',
  'Referer': 'https://www.alicesw.com/',
}

export interface AliceNovelSummary {
  id: string
  title: string
  author: string
  cover: string
  category: string
  wordCount?: string
  views?: string
  status?: string
  latestChapter?: string
  latestChapterUrl?: string
  updateTime?: string
  intro?: string
  tags?: string[]
  url: string
}

export interface AliceCategoryInfo {
  id: string
  name: string
  url: string
}

export interface AliceHomeData {
  featured: AliceNovelSummary[]
  latestNovels: AliceNovelSummary[]
  rankSections: {
    title: string
    novels: AliceNovelSummary[]
  }[]
  categories: AliceCategoryInfo[]
}

export interface AliceNovelDetail extends AliceNovelSummary {
  bookmarks?: string
  totalChapters?: number
  fullIntro: string
  chaptersUrl?: string
  recentChapters: {
    title: string
    url: string
    time?: string
  }[]
}

// Helper to normalize image URL
export function normalizeImgUrl(src: string | undefined): string {
  if (!src) return 'https://img.321cdn.com/img/01.png'
  if (src.startsWith('//')) return 'https:' + src
  if (src.startsWith('/')) return BASE_URL + src
  return src
}

// Helper to normalize novel link
export function normalizeNovelUrl(href: string | undefined): string {
  if (!href) return ''
  if (href.startsWith('http')) return href
  return BASE_URL + (href.startsWith('/') ? href : '/' + href)
}

// Extract novel ID from href
export function extractNovelId(href: string | undefined): string {
  if (!href) return ''
  const match = href.match(/\/novel\/(\d+)\.html/)
  return match ? match[1] : href.replace(/[^0-9]/g, '')
}

export async function fetchHtml(url: string): Promise<string> {
  const targetUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`
  const res = await fetch(targetUrl, {
    headers: DEFAULT_HEADERS,
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch from AliceSW (${res.status}): ${targetUrl}`)
  }
  return await res.text()
}

export async function parseAliceHome(): Promise<AliceHomeData> {
  const html = await fetchHtml('/')
  const $ = cheerio.load(html)

  // 1. Categories from Nav
  const categories: AliceCategoryInfo[] = []
  $('.nav-fenlei .fenlei-item a, .fenlei-item a').each((_, el) => {
    const href = $(el).attr('href') || ''
    const name = $(el).text().trim()
    const idMatch = href.match(/\/lists\/(\d+)\.html/)
    if (idMatch && name) {
      categories.push({
        id: idMatch[1],
        name,
        url: normalizeNovelUrl(href),
      })
    }
  })

  // 2. Featured cards / Recommended novels on homepage
  const featured: AliceNovelSummary[] = []
  const seenIds = new Set<string>()

  // Find all cards with novel link + image or h5/h4/h3 title
  $('div[class*="img"], div[class*="box"], div[class*="item"], .class-img, .rec-item').each((_, el) => {
    const link = $(el).find('a[href*="/novel/"]').first()
    const href = link.attr('href') || ''
    const id = extractNovelId(href)
    if (!id || seenIds.has(id)) return

    const heading = $(el).find('h5, h4, h3').first()
    const title = heading.text().trim() || link.attr('title') || link.text().trim()
    if (!title) return

    const img = $(el).find('img').first()
    const coverRaw = img.attr('data-src') || img.attr('src')
    const cover = normalizeImgUrl(coverRaw)
    
    // Author text e.g. "作者：林哲"
    const wholeText = $(el).text()
    const authorMatch = wholeText.match(/作者[:：]\s*([^\s\n\t<]+)/)
    const author = authorMatch ? authorMatch[1].trim() : $(el).find('.author, em').text().replace('/', '').trim()
    const intro = $(el).find('p').first().text().trim()

    seenIds.add(id)
    featured.push({
      id,
      title,
      author,
      cover,
      category: '',
      intro,
      url: normalizeNovelUrl(href),
    })
  })

  // If none found with class selector, grab all novel links that contain images
  if (featured.length === 0) {
    $('a[href*="/novel/"]').each((_, a) => {
      const href = $(a).attr('href') || ''
      const id = extractNovelId(href)
      if (!id || seenIds.has(id)) return

      const parent = $(a).closest('div, li')
      const title = $(a).text().trim() || parent.find('h5, h4, h3, a').text().trim()
      if (!title || title.length < 2) return

      const img = parent.find('img')
      const cover = img.length ? normalizeImgUrl(img.attr('data-src') || img.attr('src')) : 'https://img.321cdn.com/img/01.png'
      const author = parent.find('.author').text().replace('/', '').trim()
      const intro = parent.find('p').text().trim()

      seenIds.add(id)
      featured.push({
        id,
        title,
        author,
        cover,
        category: '',
        intro,
        url: normalizeNovelUrl(href),
      })
    })
  }

  // 3. Latest novels from ul.item-index li.noxt
  const latestNovels: AliceNovelSummary[] = []
  $('ul.item-index li.noxt').each((_, el) => {
    const novelLink = $(el).find('a.ititle')
    const href = novelLink.attr('href') || ''
    const title = novelLink.text().trim()
    const id = extractNovelId(href)
    if (!title || !id) return

    const category = $(el).find('a.ctitle').text().trim()
    const latestChapter = $(el).find('a.zjie').text().trim()
    const latestChapterUrl = $(el).find('a.zjie').attr('href')
    const author = $(el).find('.author').text().trim()
    const updateTime = $(el).find('.time').text().trim()

    latestNovels.push({
      id,
      title,
      author,
      cover: 'https://img.321cdn.com/img/01.png',
      category,
      latestChapter,
      latestChapterUrl: latestChapterUrl ? normalizeNovelUrl(latestChapterUrl) : undefined,
      updateTime,
      url: normalizeNovelUrl(href),
    })
  })

  // 4. Rank lists on home
  const rankSections: { title: string; novels: AliceNovelSummary[] }[] = []
  
  // Look for sections with headings and li items
  const sectionHeadings = ['乱伦排行榜', '都市排行榜', '同人排行榜', '玄幻排行榜', '重磅推荐', '原创专区']
  for (const hText of sectionHeadings) {
    const heading = $(`h2:contains("${hText}"), h3:contains("${hText}")`).first()
    if (heading.length) {
      const container = heading.closest('div').next() || heading.parent()
      const novels: AliceNovelSummary[] = []
      container.find('li').each((_, li) => {
        const link = $(li).find('a[href*="/novel/"]').first()
        if (!link.length) return
        const href = link.attr('href') || ''
        const title = link.text().trim()
        const id = extractNovelId(href)
        const author = $(li).find('.author').text().replace('/', '').trim()
        if (title && id) {
          novels.push({
            id,
            title,
            author,
            cover: 'https://img.321cdn.com/img/01.png',
            category: '',
            url: normalizeNovelUrl(href),
          })
        }
      })
      if (novels.length > 0) {
        rankSections.push({
          title: hText,
          novels: novels.slice(0, 10),
        })
      }
    }
  }

  return {
    featured: featured.slice(0, 20),
    latestNovels: latestNovels.slice(0, 30),
    rankSections,
    categories,
  }
}

export async function parseAliceCategory(
  id: string,
  order: string = 'update_time+desc',
  page: number = 1
): Promise<{
  title: string
  novels: AliceNovelSummary[]
  page: number
  totalPage?: number
}> {
  const url = page > 1 
    ? `/all/id/${id}/order/${order}/page/${page}.html`
    : `/all/id/${id}/order/${order}.html`
    
  let html = ''
  try {
    html = await fetchHtml(url)
  } catch {
    html = await fetchHtml(`/lists/${id}.html`)
  }

  const $ = cheerio.load(html)
  const categoryTitle = $('.rtit h2, .bread-crumbs li').last().text().replace('小说列表', '').trim() || 'Danh sách thể loại'

  const novels: AliceNovelSummary[] = []
  $('.rec_rullist ul, .rec_rboxone ul:not(.rec_rulbox)').each((_, el) => {
    const novelLink = $(el).find('.two a, a[href*="/novel/"]')
    if (!novelLink.length) return
    const href = novelLink.attr('href') || ''
    const title = novelLink.text().trim()
    const id = extractNovelId(href)
    const category = $(el).find('.sev a').text().trim()
    const latestChapter = $(el).find('.three a').text().trim()
    const latestChapterUrl = $(el).find('.three a').attr('href')
    const author = $(el).find('.four').text().trim()
    const wordCount = $(el).find('.five').text().trim()
    const updateTime = $(el).find('.six').text().trim()
    const views = $(el).find('.diyhot').text().trim()

    if (title && id) {
      novels.push({
        id,
        title,
        author,
        cover: 'https://img.321cdn.com/img/01.png',
        category,
        wordCount,
        views,
        updateTime,
        latestChapter,
        latestChapterUrl: latestChapterUrl ? normalizeNovelUrl(latestChapterUrl) : undefined,
        url: normalizeNovelUrl(href),
      })
    }
  })

  // Pagination detection
  let totalPage = 1
  $('.pagination a, .layui-laypage a, .page a').each((_, el) => {
    const pNum = parseInt($(el).text().trim(), 10)
    if (!isNaN(pNum) && pNum > totalPage) {
      totalPage = pNum
    }
  })

  return {
    title: categoryTitle,
    novels,
    page,
    totalPage,
  }
}

export async function parseAliceRank(
  type: string = 'hits_day',
  page: number = 1
): Promise<{
  title: string
  novels: AliceNovelSummary[]
}> {
  const url = `/other/rank_hits/order/${type}.html`
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const novels: AliceNovelSummary[] = []
  $('.rec_rullist ul, .rank_list ul, .table-list tr').each((_, el) => {
    const novelLink = $(el).find('a[href*="/novel/"]')
    if (!novelLink.length) return
    const href = novelLink.attr('href') || ''
    const title = novelLink.text().trim()
    const id = extractNovelId(href)
    const category = $(el).find('.sev a, .type a').text().trim()
    const author = $(el).find('.four, .author').text().trim()
    const wordCount = $(el).find('.five, .words').text().trim()
    const views = $(el).find('.diyhot, .hits').text().trim()
    const updateTime = $(el).find('.six, .time').text().trim()
    const latestChapter = $(el).find('.three a').text().trim()

    if (title && id) {
      novels.push({
        id,
        title,
        author,
        cover: 'https://img.321cdn.com/img/01.png',
        category,
        wordCount,
        views,
        updateTime,
        latestChapter,
        url: normalizeNovelUrl(href),
      })
    }
  })

  const titleMap: Record<string, string> = {
    hits_day: 'Bảng xếp hạng Ngày (本日排行)',
    hits_week: 'Bảng xếp hạng Tuần (本周排行)',
    hits_month: 'Bảng xếp hạng Tháng (本月排行)',
    hits: 'Bảng xếp hạng Tổng (总排行)',
  }

  return {
    title: titleMap[type] || 'Bảng xếp hạng',
    novels,
  }
}

export async function parseAliceSearch(
  q: string,
  type: string = '_all',
  page: number = 1
): Promise<{
  query: string
  novels: AliceNovelSummary[]
  page: number
  totalCount?: number
}> {
  const url = `/search.html?q=${encodeURIComponent(q)}&f=${type}&page=${page}`
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const novels: AliceNovelSummary[] = []

  $('.list-group-item').each((_, el) => {
    const titleLink = $(el).find('h5 a')
    const href = titleLink.attr('href') || ''
    const rawTitle = titleLink.text().trim()
    // remove leading index e.g. "1. "
    const title = rawTitle.replace(/^\d+\.\s*/, '')
    const id = extractNovelId(href)
    const status = $(el).find('small').text().trim().replace(/[\[\]]/g, '')

    const metaP = $(el).find('p.mb-1, p.text-muted').first()
    const metaText = metaP.text()
    const authorMatch = metaText.match(/作者：([^\s\n\t]+)/)
    const author = authorMatch ? authorMatch[1].trim() : $(el).find('a[href*="f=author"]').text().trim()
    
    const wordMatch = metaText.match(/字数：([^\s\n\t]+)/)
    const wordCount = wordMatch ? wordMatch[1].trim() : ''

    const viewsMatch = metaText.match(/浏览：([^\s\n\t]+)/)
    const views = viewsMatch ? viewsMatch[1].trim() : ''

    const intro = $(el).find('.content-txt').text().trim()

    const tags: string[] = []
    $(el).find('a[href*="f=tag"]').each((_, tagEl) => {
      const t = $(tagEl).text().replace('#', '').trim()
      if (t) tags.push(t)
    })

    const updateTime = $(el).find('.timedesc').text().replace('发布时间：', '').trim()
    const coverRaw = $(el).find('img').attr('src') || $(el).find('img').attr('data-src')

    if (title && id) {
      novels.push({
        id,
        title,
        author,
        cover: normalizeImgUrl(coverRaw),
        category: '',
        status,
        wordCount,
        views,
        intro,
        tags,
        updateTime,
        url: normalizeNovelUrl(href),
      })
    }
  })

  return {
    query: q,
    novels,
    page,
    totalCount: novels.length,
  }
}

export async function parseAliceNovel(idOrUrl: string): Promise<AliceNovelDetail> {
  const cleanId = idOrUrl.replace(/[^0-9]/g, '')
  const url = idOrUrl.startsWith('http') 
    ? idOrUrl 
    : idOrUrl.startsWith('/') 
      ? idOrUrl 
      : `/novel/${cleanId || idOrUrl}.html`

  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const title = $('.novel_title').first().text().trim() || $('h1').first().text().trim() || $('title').text().split('-')[0].trim()
  const id = extractNovelId(url) || cleanId

  const coverRaw = $('.fengmian2').attr('data-src') || $('.fengmian2').attr('src') || $('.pic img').attr('src') || $('.pic img').attr('data-src')
  const cover = normalizeImgUrl(coverRaw)

  let author = ''
  let category = ''
  let heat = ''
  let bookmarks = ''
  let wordCount = ''
  let totalChapters = 0
  let status = ''
  let latestChapter = ''
  let latestChapterUrl = ''

  $('.novel_info p').each((_, p) => {
    const text = $(p).text()
    if (text.includes('作 者：') || text.includes('作者：')) {
      author = $(p).find('a').text().trim() || text.replace(/作\s*者：/, '').trim()
    }
    if (text.includes('分 类：') || text.includes('分类：')) {
      category = $(p).find('a').text().trim() || text.replace(/分\s*类：/, '').trim()
    }
    if (text.includes('热 度：') || text.includes('热度：')) {
      const heatMatch = text.match(/热\s*度：\s*(\d+)/)
      if (heatMatch) heat = heatMatch[1]
      const scMatch = text.match(/收\s*藏：\s*(\d+)/)
      if (scMatch) bookmarks = scMatch[1]
    }
    if (text.includes('字 数：') || text.includes('字数：')) {
      const wordMatch = text.match(/字\s*数：\s*([^\s·]+)/)
      if (wordMatch) wordCount = wordMatch[1]
      const chapMatch = text.match(/章\s*节：\s*(\d+)/)
      if (chapMatch) totalChapters = parseInt(chapMatch[1], 10)
    }
    if (text.includes('状 态：') || text.includes('状态：')) {
      status = text.replace(/状\s*态：/, '').trim()
    }
    if (text.includes('最 新：') || text.includes('最新：')) {
      latestChapter = $(p).find('a').text().trim()
      latestChapterUrl = $(p).find('a').attr('href') || ''
    }
  })

  // Tags
  const tags: string[] = []
  $('.tags_list a').each((_, a) => {
    const tag = $(a).text().replace('#', '').trim()
    if (tag) tags.push(tag)
  })

  // Full Intro
  const fullIntro = $('.jianjie p').first().text().trim() || $('.jianjie').text().replace('内容简介：', '').trim()

  // Recent Chapters
  const recentChapters: { title: string; url: string; time?: string }[] = []
  $('.book_newchap .con li').each((_, li) => {
    const a = $(li).find('a')
    const chTitle = a.text().trim()
    const chUrl = a.attr('href') || ''
    const time = $(li).find('em').text().replace('更新时间：', '').trim()
    if (chTitle && chUrl) {
      recentChapters.push({
        title: chTitle,
        url: normalizeNovelUrl(chUrl),
        time,
      })
    }
  })

  const chaptersUrl = $('.tabtitle a[href*="/other/chapters/"]').attr('href') || `/other/chapters/id/${cleanId || id}.html`

  return {
    id,
    title,
    author,
    cover,
    category,
    status: status || '连载中',
    wordCount,
    views: heat,
    bookmarks,
    totalChapters: totalChapters || recentChapters.length,
    latestChapter,
    latestChapterUrl: latestChapterUrl ? normalizeNovelUrl(latestChapterUrl) : undefined,
    fullIntro,
    tags,
    chaptersUrl: chaptersUrl ? normalizeNovelUrl(chaptersUrl) : undefined,
    recentChapters,
    url: normalizeNovelUrl(url),
  }
}

export interface AliceChapterItem {
  index: number
  title: string
  url: string
}

export interface AliceChapterContent {
  title: string
  content: string
  prevUrl?: string
  nextUrl?: string
  novelUrl?: string
}

export async function parseAliceChapters(novelIdOrUrl: string): Promise<{
  novelId: string
  novelTitle?: string
  totalChapters: number
  chapters: AliceChapterItem[]
}> {
  const cleanId = novelIdOrUrl.replace(/[^0-9]/g, '')
  let chaptersUrl = ''

  if (novelIdOrUrl.includes('/other/chapters/')) {
    chaptersUrl = novelIdOrUrl
  } else if (novelIdOrUrl.includes('/novel/')) {
    chaptersUrl = `/other/chapters/id/${cleanId}.html`
  } else {
    chaptersUrl = `/other/chapters/id/${cleanId || novelIdOrUrl}.html`
  }

  let html = ''
  try {
    html = await fetchHtml(chaptersUrl)
  } catch {
    // fallback: load novel detail page and find chapters link
    const novelHtml = await fetchHtml(`/novel/${cleanId}.html`)
    const $n = cheerio.load(novelHtml)
    const link = $n('a[href*="/other/chapters/"]').attr('href')
    if (link) {
      html = await fetchHtml(link)
    } else {
      throw new Error(`Không tìm thấy mục lục chương cho truyện ${novelIdOrUrl}`)
    }
  }

  const $ = cheerio.load(html)
  const novelTitle = $('h1, h2, .novel_title, title').first().text().replace('章节列表', '').replace('全部章节', '').trim()

  const chapters: AliceChapterItem[] = []
  $('a[href*="/book/"]').each((i, el) => {
    const rawTitle = $(el).text().trim()
    const href = $(el).attr('href') || ''
    if (rawTitle && href) {
      chapters.push({
        index: i + 1,
        title: rawTitle,
        url: normalizeNovelUrl(href),
      })
    }
  })

  // If no /book/ links found, try list items
  if (chapters.length === 0) {
    $('.chapter-list a, .book_newchap a, .con a').each((i, el) => {
      const rawTitle = $(el).text().trim()
      const href = $(el).attr('href') || ''
      if (rawTitle && href && href !== '#') {
        chapters.push({
          index: i + 1,
          title: rawTitle,
          url: normalizeNovelUrl(href),
        })
      }
    })
  }

  return {
    novelId: cleanId,
    novelTitle,
    totalChapters: chapters.length,
    chapters,
  }
}

export async function parseAliceChapterContent(chapterUrl: string): Promise<AliceChapterContent> {
  const html = await fetchHtml(chapterUrl)
  const $ = cheerio.load(html)

  // Title
  const title = $('.content_title, .title, h1, h2').first().text().trim() || $('title').text().split('-')[0].trim()

  // Content selector
  const contentEl = $('#content, .content, .read_chapterDetail, .read-content, #htmlContent').first()
  
  // Clean unwanted tags
  contentEl.find('script, style, .ads, ins, iframe, .button, .read_nav, .bottem2').remove()

  let rawHtml = contentEl.html() || ''
  rawHtml = rawHtml.replace(/<br\s*[\/]?>/gi, '\n')
  rawHtml = rawHtml.replace(/<\/p>/gi, '\n')
  rawHtml = rawHtml.replace(/<p[^>]*>/gi, '')

  const $clean = cheerio.load(rawHtml)
  const cleanContent = $clean.text()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n\n')

  const prevLink = $('a:contains("上一章"), a[class*="prev"]').attr('href')
  const nextLink = $('a:contains("下一章"), a[class*="next"]').attr('href')
  const novelLink = $('a:contains("返回目录"), a:contains("目录"), a[href*="/novel/"]').attr('href')

  return {
    title,
    content: cleanContent,
    prevUrl: prevLink && !prevLink.includes('javascript') ? normalizeNovelUrl(prevLink) : undefined,
    nextUrl: nextLink && !nextLink.includes('javascript') ? normalizeNovelUrl(nextLink) : undefined,
    novelUrl: novelLink ? normalizeNovelUrl(novelLink) : undefined,
  }
}

