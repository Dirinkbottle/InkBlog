import { create } from 'zustand'
import { normalizeLibrary, readingSnapshot } from '../lib/reading'

const key = 'inkblog-reading-library-v1'
let initial = { bookmarks: [], history: [] }
let storageError = false
try {
  initial = normalizeLibrary(JSON.parse(localStorage.getItem(key)))
} catch {
  storageError = true
}

function persistLibrary(library) {
  try {
    localStorage.setItem(key, JSON.stringify(library))
    return false
  } catch {
    return true
  }
}

const useReadingStore = create((set, get) => ({
  ...initial,
  storageError,
  toggleBookmark: (post) => {
    const { bookmarks, history } = get()
    const exists = bookmarks.some((item) => item.id === post.id)
    const next = exists
      ? bookmarks.filter((item) => item.id !== post.id)
      : [readingSnapshot(post), ...bookmarks].slice(0, 200)
    const library = { bookmarks: next, history }
    set({ ...library, storageError: persistLibrary(library) })
  },
  remember: (post, progress) => {
    const { bookmarks, history } = get()
    const library = {
      bookmarks,
      history: [
        {
          ...readingSnapshot(post),
          progress,
          readAt: new Date().toISOString(),
        },
        ...history.filter((item) => item.id !== post.id),
      ].slice(0, 50),
    }
    set({ ...library, storageError: persistLibrary(library) })
  },
  clearHistory: () => {
    const library = { bookmarks: get().bookmarks, history: [] }
    set({ ...library, storageError: persistLibrary(library) })
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return
    try {
      useReadingStore.setState({
        ...normalizeLibrary(JSON.parse(event.newValue)),
        storageError: false,
      })
    } catch {
      /* Ignore a malformed external write. */
    }
  })
}
export default useReadingStore
