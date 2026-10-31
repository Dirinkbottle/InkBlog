import React from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'sonner'
import useReadingStore from '../../store/readingStore'

export default function BookmarkButton({ post, compact = false }) {
  const saved = useReadingStore((state) =>
    state.bookmarks.some((item) => item.id === post.id),
  )
  const toggleBookmark = useReadingStore((state) => state.toggleBookmark)
  const toggle = () => {
    toggleBookmark(post)
    if (useReadingStore.getState().storageError)
      toast.warning('浏览器存储不可用，本次收藏仅在当前页面保留')
    else toast.success(saved ? '已移出稍后读' : '已加入稍后读')
  }
  const label = saved ? '移出稍后读' : '加入稍后读'
  return (
    <button
      className={
        compact ? 'icon-button bookmark-button' : 'ink-button secondary'
      }
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={saved}
    >
      {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
      {!compact && (saved ? '已收藏' : '稍后读')}
    </button>
  )
}
