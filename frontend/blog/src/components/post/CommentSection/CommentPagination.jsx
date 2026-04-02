import React from 'react'
import { Button } from '../../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CommentPagination({ page, totalPages, total, setPage }) {
  if (totalPages <= 1) return null

  const safeSetPage = (target) => {
    if (target < 1 || target > totalPages || target === page) return
    setPage(target)
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter((pageNum) => (
    pageNum === 1 ||
    pageNum === totalPages ||
    (pageNum >= page - 1 && pageNum <= page + 1)
  ))

  return (
    <>
      <div className="flex items-center justify-center gap-2 pt-6">
        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700"
          onClick={() => safeSetPage(page - 1)}
          disabled={page <= 1}
          aria-label="上一页评论"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一页
        </Button>
        
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            const prev = pageNumbers[index - 1]
            const withGap = prev && pageNum - prev > 1
            return (
              <React.Fragment key={pageNum}>
                {withGap && <span className="px-2 text-slate-400">...</span>}
                <Button
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-[40px] border-slate-300"
                  onClick={() => safeSetPage(pageNum)}
                  aria-label={`跳转到评论第 ${pageNum} 页`}
                >
                  {pageNum}
                </Button>
              </React.Fragment>
            )
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700"
          onClick={() => safeSetPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="下一页评论"
        >
          下一页
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {total > 0 && (
        <div className="text-center pt-2 text-xs text-slate-500">
          共 {total} 条评论，第 {page} / {totalPages} 页
        </div>
      )}
    </>
  )
}
