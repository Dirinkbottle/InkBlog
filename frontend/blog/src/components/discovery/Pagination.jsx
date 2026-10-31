import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1 && page <= 1) return null
  return (
    <nav className="ink-pagination" aria-label="文章分页">
      <button
        className="ink-button secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16} />
        上一页
      </button>
      <span>
        第 <strong>{page}</strong> / {Math.max(1, totalPages)} 页
      </span>
      <button
        className="ink-button secondary"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        下一页
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
