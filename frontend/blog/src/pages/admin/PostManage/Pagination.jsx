import React from 'react'
import { Button } from '../../../components/ui/button'

export default function Pagination({ page, totalPages, setPage }) {
  if (!totalPages || totalPages <= 1) return null

  return (
    <div className="flex justify-center items-center space-x-2">
      <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page <= 1}>
        上一页
      </Button>
      <span className="text-sm text-muted-foreground">
        第 {page} / {totalPages} 页
      </span>
      <Button
        variant="outline"
        onClick={() => setPage(page + 1)}
        disabled={page >= totalPages}
      >
        下一页
      </Button>
    </div>
  )
}
