import React, { useEffect, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { FileText } from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'
import { Button } from '../../components/ui/button'
import PostCard from '../../components/post/PostCard'

export default function UserPostsList({ posts, loading, page, totalPages, setPage }) {
  const listTopRef = useRef(null)

  const goPrev = () => {
    if (page > 1) setPage(page - 1)
  }
  const goNext = () => {
    if (page < totalPages) setPage(page + 1)
  }

  useEffect(() => {
    if (!loading && listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [loading, page])

  return (
    <Card className="border-slate-200 bg-white shadow-sm" ref={listTopRef}>
      <CardHeader>
        <CardTitle className="flex items-center text-slate-900">
          <FileText className="h-5 w-5 mr-2 text-sky-600" />
          发表的文章
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 rounded-lg">
            该用户还没有发表文章
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <Button
                  variant="outline"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  className="border-slate-300 text-slate-700"
                  aria-label="跳转到第一页"
                >
                  首页
                </Button>
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={page <= 1}
                  className="border-slate-300 text-slate-700"
                >
                  上一页
                </Button>
                <span className="text-sm text-slate-500">
                  第 {page} / {totalPages} 页
                </span>
                <Button
                  variant="outline"
                  onClick={goNext}
                  disabled={page >= totalPages}
                  className="border-slate-300 text-slate-700"
                >
                  下一页
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="border-slate-300 text-slate-700"
                  aria-label="跳转到最后一页"
                >
                  末页
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
