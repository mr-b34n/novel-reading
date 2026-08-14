import { translator } from './translator'
import type { AliceNovelItem, AliceNovelDetail, AliceCategory } from '@/types'

export interface HomeResponse {
  featured: AliceNovelItem[]
  latestNovels: AliceNovelItem[]
  rankSections: {
    title: string
    novels: AliceNovelItem[]
  }[]
  categories: AliceCategory[]
}

const CATEGORY_MAP: Record<string, string> = {
  '都市': 'Đô Thị',
  '都市小说': 'Đô Thị',
  '玄幻': 'Huyền Huyễn',
  '玄幻小说': 'Huyền Huyễn',
  '同人': 'Đồng Nhân',
  '同人小说': 'Đồng Nhân',
  '武侠': 'Võ Hiệp',
  '武侠小说': 'Võ Hiệp',
  '科幻': 'Khoa Huyễn',
  '科幻小说': 'Khoa Huyễn',
  '奇幻': 'Kỳ Huyễn',
  '奇幻小说': 'Kỳ Huyễn',
  '系统': 'Hệ Thống',
  '穿越': 'Xuyên Không',
  '校园': 'Học Đường',
  '乡村': 'Nông Thôn',
  '经典': 'Kinh Điển',
  '纯爱': 'Thuần Ái',
  '乱伦': 'Loạn Luân',
  '堕落': 'Đọa Lạc',
  '凌辱': 'Lăng Nhục',
  '反差': 'Phản Sai',
  '萝莉': 'Loli',
  '熟女': 'Thục Nữ',
  '伪娘': 'Ngụy Nương',
  '正太': 'Shota',
  '明星': 'Minh Tinh',
  '原创': 'Nguyên Tác / Tự Sáng Tác',
}

export function translateCategory(cat: string): string {
  if (!cat) return ''
  const clean = cat.trim()
  if (CATEGORY_MAP[clean]) return CATEGORY_MAP[clean]
  return translator.translateText(clean) || clean
}

export interface TranslatedNovelItem extends AliceNovelItem {
  translatedTitle: string
  translatedAuthor: string
  translatedCategory: string
  translatedLatestChapter?: string
  translatedIntro?: string
  translatedTags?: string[]
}

export interface TranslatedNovelDetail extends AliceNovelDetail {
  translatedTitle: string
  translatedAuthor: string
  translatedCategory: string
  translatedLatestChapter?: string
  translatedFullIntro: string
  translatedTags: string[]
}

export function translateNovelItem(novel: AliceNovelItem): TranslatedNovelItem {
  const transTitle = translator.translateText(novel.title) || novel.title
  const transAuthor = translator.translateText(novel.author) || novel.author
  const transCat = translateCategory(novel.category)
  const transLatest = novel.latestChapter ? translator.translateText(novel.latestChapter) || novel.latestChapter : undefined
  const transIntro = novel.intro ? translator.translateText(novel.intro) || novel.intro : undefined
  const transTags = novel.tags?.map((t) => translator.translateText(t) || t)

  return {
    ...novel,
    translatedTitle: transTitle,
    translatedAuthor: transAuthor,
    translatedCategory: transCat,
    translatedLatestChapter: transLatest,
    translatedIntro: transIntro,
    translatedTags: transTags,
  }
}

export function translateNovelDetail(detail: AliceNovelDetail): TranslatedNovelDetail {
  const base = translateNovelItem(detail)
  const transFullIntro = detail.fullIntro ? translator.translateText(detail.fullIntro) || detail.fullIntro : ''
  const transTags = detail.tags?.map((t) => translator.translateText(t) || t) || []

  return {
    ...base,
    ...detail,
    translatedFullIntro: transFullIntro,
    translatedTags: transTags,
  }
}

export async function fetchAliceHome(): Promise<HomeResponse> {
  const res = await fetch('/api/source/alicesw/home')
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Không thể tải trang chủ AliceSW')
  return json.data
}

export async function fetchAliceCategory(
  id: string,
  order: string = 'update_time+desc',
  page: number = 1
): Promise<{
  title: string
  novels: AliceNovelItem[]
  page: number
  totalPage?: number
}> {
  const res = await fetch(`/api/source/alicesw/category?id=${encodeURIComponent(id)}&order=${encodeURIComponent(order)}&page=${page}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Không thể tải danh sách thể loại')
  return json.data
}

export async function fetchAliceRank(
  type: string = 'hits_day',
  page: number = 1
): Promise<{
  title: string
  novels: AliceNovelItem[]
}> {
  const res = await fetch(`/api/source/alicesw/rank?type=${encodeURIComponent(type)}&page=${page}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Không thể tải bảng xếp hạng')
  return json.data
}

export async function searchAlice(
  q: string,
  type: string = '_all',
  page: number = 1
): Promise<{
  query: string
  novels: AliceNovelItem[]
  page: number
  totalCount?: number
}> {
  const res = await fetch(`/api/source/alicesw/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&page=${page}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Không thể tìm kiếm truyện')
  return json.data
}

export async function fetchAliceNovel(idOrUrl: string): Promise<AliceNovelDetail> {
  const res = await fetch(`/api/source/alicesw/novel?id=${encodeURIComponent(idOrUrl)}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Không thể tải thông tin truyện')
  return json.data
}

export interface AliceChapterItem {
  index: number
  title: string
  url: string
  translatedTitle?: string
}

export interface AliceChapterContent {
  title: string
  content: string
  prevUrl?: string
  nextUrl?: string
  novelUrl?: string
}

export async function fetchAliceChapters(idOrUrl: string): Promise<{
  novelId: string
  novelTitle?: string
  totalChapters: number
  chapters: AliceChapterItem[]
}> {
  const res = await fetch(`/api/source/alicesw/chapters?id=${encodeURIComponent(idOrUrl)}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Không thể tải mục lục chương')
  return json.data
}

export async function fetchAliceChapterContent(chapterUrl: string): Promise<AliceChapterContent> {
  const res = await fetch(`/api/source/alicesw/chapter?url=${encodeURIComponent(chapterUrl)}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Không thể tải nội dung chương')
  return json.data
}

