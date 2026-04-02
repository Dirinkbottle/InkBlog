import React from 'react'
import { Button } from '../../../components/ui/button'

export default function Pagination({ page, totalPages, setPage }) {
  if (!totalPages || totalPages <= 1) return null
  const goTo = (target) => {
    if (target < 1 || target > totalPages || target === page) return
    setPage(target)
  }

  return (
    <div className="flex justify-center items-center space-x-2 rounded-lg border border-slate-200 bg-white p-3">
      <Button variant="outline" className="border-slate-300 text-slate-700" onClick={() => goTo(page - 1)} disabled={page <= 1}>
        上一页
      </Button>
      <span className="text-sm text-slate-500">
        第 {page} / {totalPages} 页
      </span>
      <Button
        variant="outline"
        className="border-slate-300 text-slate-700"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
      >
        下一页
      </Button>
    </div>
  )
}
