import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'novreader-vp-db'
const DB_VERSION = 4

const STORE_VP = 'vietphrase'
const STORE_NAMES = 'names'
const STORE_CUSTOM = 'custom_names'
const STORE_CACHE = 'chapter_cache'
const STORE_LUAT_NHAN = 'luat_nhan'
const STORE_PRONOUNS = 'pronouns'

let _vpDb: IDBPDatabase | null = null

async function getVpDB(): Promise<IDBPDatabase> {
  if (_vpDb) return _vpDb
  _vpDb = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_VP)) {
        db.createObjectStore(STORE_VP)
      }
      if (!db.objectStoreNames.contains(STORE_NAMES)) {
        db.createObjectStore(STORE_NAMES)
      }
      if (!db.objectStoreNames.contains(STORE_CUSTOM)) {
        db.createObjectStore(STORE_CUSTOM, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(STORE_LUAT_NHAN)) {
        db.createObjectStore(STORE_LUAT_NHAN)
      }
      if (!db.objectStoreNames.contains(STORE_PRONOUNS)) {
        db.createObjectStore(STORE_PRONOUNS)
      }
    },
  })
  return _vpDb
}

export interface CustomNameEntry {
  key: string // `${bookTitle}::${chapterIndex || 'global'}::${zh}`
  bookTitle: string
  chapterIndex: number | 'global' | 'global_all'
  zh: string
  vi: string
  hanviet?: string
  createdAt: number
  isBlacklist?: boolean
}

/**
 * Save custom user name entry (chapter-specific or book-wide)
 */
export async function saveCustomName(entry: CustomNameEntry): Promise<void> {
  const db = await getVpDB()
  await db.put(STORE_CUSTOM, entry)
}

/**
 * Get custom user names for a specific book and chapter
 */
export async function getCustomNamesForChapter(bookTitle: string, chapterIndex: number | 'global' | 'global_all'): Promise<CustomNameEntry[]> {
  const db = await getVpDB()
  const all: CustomNameEntry[] = await db.getAll(STORE_CUSTOM)
  return all.filter((e) => {
    if (e.chapterIndex === 'global_all') return true
    if (e.bookTitle !== bookTitle) return false
    return e.chapterIndex === 'global' || e.chapterIndex === chapterIndex
  }).sort((a, b) => b.zh.length - a.zh.length)
}

/**
 * Delete a custom user name
 */
export async function deleteCustomName(key: string): Promise<void> {
  const db = await getVpDB()
  await db.delete(STORE_CUSTOM, key)
}

/**
 * Check if a dictionary key is purely a number or Chinese numeral sequence
 * to filter out redundant entries during import and keep memory/storage lean.
 */
export function isPureNumberEntry(zh: string): boolean {
  if (!zh) return false
  const clean = zh.trim()
  // Pure Arabic digits or math numbers (123, 3.14, 1,000, 100%, +50)
  if (/^[\d\.,\+\-\%％]+$/.test(clean) && /\d/.test(clean)) return true
  // Pure Chinese numeral combinations (一, 二十, 三百六十五, 第一百二十章, 第一, 第十二)
  if (/^(?:第)?[零〇一二两三四五六七八九十百千万亿]+(?:[章节回])?$/.test(clean)) return true
  return false
}

/**
 * Batch import Vietphrase or Names dictionary lines with chunking and progress reporting
 */
export async function importDictionaryFile(
  fileText: string,
  type: 'vietphrase' | 'names' | 'luatnhan' | 'pronouns',
  onProgress?: (percent: number, count: number) => void
): Promise<{ count: number }> {
  const db = await getVpDB()
  const storeName =
    type === 'vietphrase'
      ? STORE_VP
      : type === 'names'
      ? STORE_NAMES
      : type === 'luatnhan'
      ? STORE_LUAT_NHAN
      : STORE_PRONOUNS

  const lines = fileText.split(/\r?\n/)
  const total = lines.length
  if (total === 0) return { count: 0 }

  let count = 0
  const CHUNK_SIZE = 5000

  for (let i = 0; i < total; i += CHUNK_SIZE) {
    const chunk = lines.slice(i, i + CHUNK_SIZE)
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    for (let j = 0; j < chunk.length; j++) {
      let line = chunk[j].trim()
      if (!line || line.startsWith('#') || line.startsWith('//')) continue

      if (line.startsWith('$') || line.startsWith('@') || line.startsWith('~')) {
        line = line.substring(1)
      }

      const eqIdx = line.indexOf('=')
      if (eqIdx > 0) {
        const zh = line.substring(0, eqIdx).trim()
        const vi = line.substring(eqIdx + 1).trim()

        if (zh && vi) {
          if (type !== 'luatnhan' && isPureNumberEntry(zh)) {
            continue
          }
          store.put(vi, zh)
          count++
        }
      }
    }

    await tx.done

    if (onProgress) {
      const currentProgress = Math.min(100, Math.round(((i + chunk.length) / total) * 100))
      onProgress(currentProgress, count)
    }

    await new Promise((resolve) => setTimeout(resolve, 5))
  }

  return { count }
}

/**
 * Load all Vietphrase dictionary from IndexedDB into memory map
 */
export async function loadVietphraseMap(): Promise<Record<string, string>> {
  const db = await getVpDB()
  const keys = await db.getAllKeys(STORE_VP)
  const values = await db.getAll(STORE_VP)
  const map: Record<string, string> = {}
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i] as string
    let v = values[i] as string
    
    // Clean up dictionary keys that end with '的' (prevents shadowing custom VPs)
    let isStripped = false
    if (k.endsWith('的') && k.length > 2 && !['目的', '标的', '真的', '有的', '是的', '似的', '别的', '谁的', '什么的'].includes(k)) {
      k = k.slice(0, -1)
      v = v.replace(/(?:^|\s)đích$/i, '').replace(/(?:^|\s)của$/i, '').trim()
      isStripped = true
    }

    if (!map[k]) {
      map[k] = v
    } else {
      if (!isStripped && !map[k].includes(v)) {
        map[k] = map[k] + ' | ' + v
      }
    }
  }
  return map
}

/**
 * Load all Names dictionary from IndexedDB into memory map
 */
export async function loadNamesMap(): Promise<Record<string, string>> {
  const db = await getVpDB()
  const keys = await db.getAllKeys(STORE_NAMES)
  const values = await db.getAll(STORE_NAMES)
  const map: Record<string, string> = {}
  for (let i = 0; i < keys.length; i++) {
    let k = keys[i] as string
    let v = values[i] as string
    
    let isStripped = false
    if (k.endsWith('的') && k.length > 2 && !['目的', '标的', '真的', '有的', '是的', '似的', '别的', '谁的', '什么的'].includes(k)) {
      k = k.slice(0, -1)
      v = v.replace(/(?:^|\s)đích$/i, '').replace(/(?:^|\s)của$/i, '').trim()
      isStripped = true
    }

    if (!map[k]) {
      map[k] = v
    } else {
      if (!isStripped && !map[k].includes(v)) {
        map[k] = map[k] + ' | ' + v
      }
    }
  }
  return map
}

/**
 * Load all LuatNhan dictionary from IndexedDB into memory map
 */
export async function loadLuatNhanMap(): Promise<Record<string, string>> {
  const db = await getVpDB()
  const keys = await db.getAllKeys(STORE_LUAT_NHAN)
  const values = await db.getAll(STORE_LUAT_NHAN)
  const map: Record<string, string> = {}
  for (let i = 0; i < keys.length; i++) {
    map[keys[i] as string] = values[i] as string
  }
  return map
}

/**
 * Load all Pronouns dictionary from IndexedDB into memory map
 */
export async function loadPronounsMap(): Promise<Record<string, string>> {
  const db = await getVpDB()
  const keys = await db.getAllKeys(STORE_PRONOUNS)
  const values = await db.getAll(STORE_PRONOUNS)
  const map: Record<string, string> = {}
  for (let i = 0; i < keys.length; i++) {
    map[keys[i] as string] = values[i] as string
  }
  return map
}

/**
 * Get count of entries in DB
 */
export async function getDbCounts(): Promise<{
  vpCount: number
  namesCount: number
  customCount: number
  luatNhanCount: number
  pronounsCount: number
}> {
  const db = await getVpDB()
  const vpCount = await db.count(STORE_VP)
  const namesCount = await db.count(STORE_NAMES)
  const customCount = await db.count(STORE_CUSTOM)
  const luatNhanCount = await db.count(STORE_LUAT_NHAN)
  const pronounsCount = await db.count(STORE_PRONOUNS)
  return { vpCount, namesCount, customCount, luatNhanCount, pronounsCount }
}

/**
 * Clear DB stores
 */
export async function clearDbStore(
  type: 'vietphrase' | 'names' | 'custom' | 'cache' | 'luatnhan' | 'pronouns'
): Promise<void> {
  const db = await getVpDB()
  if (type === 'vietphrase') await db.clear(STORE_VP)
  if (type === 'names') await db.clear(STORE_NAMES)
  if (type === 'custom') await db.clear(STORE_CUSTOM)
  if (type === 'cache') await db.clear(STORE_CACHE)
  if (type === 'luatnhan') await db.clear(STORE_LUAT_NHAN)
  if (type === 'pronouns') await db.clear(STORE_PRONOUNS)
}

export interface ChapterCacheEntry {
  key: string
  bookTitle: string
  chapterIndex: number
  mode?: string
  tokens: any[]
  translatedText?: string
  updatedAt: number
}

/**
 * Save chapter translation tokens to IndexedDB cache
 */
export async function saveChapterCache(
  bookTitle: string,
  chapterIndex: number,
  mode: string,
  tokens: any[],
  translatedText?: string
): Promise<void> {
  try {
    const db = await getVpDB()
    const key = `${bookTitle}::${chapterIndex}`
    const entry: ChapterCacheEntry = {
      key,
      bookTitle,
      chapterIndex,
      mode,
      tokens,
      translatedText,
      updatedAt: Date.now(),
    }
    await db.put(STORE_CACHE, entry)

    // Also update Book object so translations are permanently saved with the book
    try {
      const { loadBook, saveBook } = await import('./db')
      const book = await loadBook(bookTitle)
      if (book && book.chapters && book.chapters[chapterIndex]) {
        book.chapters[chapterIndex].translatedTokens = tokens
        if (translatedText) book.chapters[chapterIndex].translatedText = translatedText
        await saveBook(book)
      }
    } catch (bookErr) {
      console.warn('Failed to save translation to Book object', bookErr)
    }
  } catch (err) {
    console.warn('Failed to save chapter cache', err)
  }
}

/**
 * Get chapter translation tokens from IndexedDB cache
 */
export async function getChapterCache(
  bookTitle: string,
  chapterIndex: number,
  mode?: string
): Promise<{ tokens: any[]; translatedText?: string } | null> {
  try {
    const db = await getVpDB()
    // First try mode-independent key
    const key = `${bookTitle}::${chapterIndex}`
    let entry: ChapterCacheEntry | undefined = await db.get(STORE_CACHE, key)
    // Fallback to legacy mode-specific keys if not found
    if (!entry && mode) {
      entry = await db.get(STORE_CACHE, `${bookTitle}::${chapterIndex}::${mode}`)
    }
    if (!entry) {
      entry = await db.get(STORE_CACHE, `${bookTitle}::${chapterIndex}::replace`)
    }
    if (!entry) {
      entry = await db.get(STORE_CACHE, `${bookTitle}::${chapterIndex}::dual`)
    }
    if (entry && entry.tokens) {
      return { tokens: entry.tokens, translatedText: entry.translatedText }
    }
  } catch (err) {
    console.warn('Failed to load chapter cache', err)
  }
  return null
}

/**
 * Clear all chapter cache (e.g. when custom names or dictionaries change)
 */
export async function clearChapterCache(): Promise<void> {
  try {
    const db = await getVpDB()
    await db.clear(STORE_CACHE)
  } catch (err) {
    console.warn('Failed to clear chapter cache', err)
  }
}

/**
 * Delete cached translation for a specific chapter
 */
export async function deleteSingleChapterCache(bookTitle: string, chapterIndex: number): Promise<void> {
  try {
    const db = await getVpDB()
    await db.delete(STORE_CACHE, `${bookTitle}::${chapterIndex}`)
    await db.delete(STORE_CACHE, `${bookTitle}::${chapterIndex}::replace`)
    await db.delete(STORE_CACHE, `${bookTitle}::${chapterIndex}::dual`)
  } catch (err) {
    console.warn('Failed to delete single chapter cache', err)
  }
}

/**
 * Clear chapter translation cache for a specific book
 */
export async function clearBookChapterCache(bookTitle: string): Promise<void> {
  try {
    const db = await getVpDB()
    const allKeys = await db.getAllKeys(STORE_CACHE)
    const tx = db.transaction(STORE_CACHE, 'readwrite')
    for (const key of allKeys) {
      if (typeof key === 'string' && key.startsWith(`${bookTitle}::`)) {
        tx.store.delete(key)
      }
    }
    await tx.done
  } catch (err) {
    console.warn('Failed to clear book chapter cache', err)
  }
}
