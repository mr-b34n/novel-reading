import { openDB, type IDBPDatabase } from 'idb'
import type { Book } from '@/types'

const DB_NAME = 'novreader-db'
const DB_VERSION = 1
const STORE_NAME = 'books'

let _db: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' })
      }
    },
  })
  return _db
}

export async function saveBook(book: Book): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, { ...book, lastAccessed: Date.now() })
}

export async function loadBook(name: string): Promise<Book | undefined> {
  const db = await getDB()
  return db.get(STORE_NAME, name)
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB()
  const books: Book[] = await db.getAll(STORE_NAME)
  return books.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
}

export async function deleteBook(name: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, name)
  localStorage.removeItem('novreader_pos_' + name)
}
