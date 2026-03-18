import React from 'react'
import { Button } from '../../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CommentPagination({ page, totalPages, total, setPage }) {
  if (totalPages <= 1) return null

  return (
    <>
      <div className="flex items-center justify-center gap-2 pt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          上一页
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= page - 1 && pageNum <= page + 1)
            ) {
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-[40px]"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            } else if (pageNum === page - 2 || pageNum === page + 2) {
              return <span key={pageNum} className="px-2">...</span>
            }
            return null
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
        >
          下一页
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {total > 0 && (
        <div className="text-center pt-2 text-xs text-muted-foreground">
          共 {total} 条评论，第 {page} / {totalPages} 页
        </div>
      )}
    </>
  )
}
