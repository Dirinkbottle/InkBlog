import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { FileText } from 'lucide-react'
import { Skeleton } from '../../components/ui/skeleton'
import { Button } from '../../components/ui/button'
import PostCard from '../../components/post/PostCard'

export default function UserPostsList({ posts, loading, page, totalPages, setPage }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
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
          <div className="text-center py-12 text-muted-foreground">
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
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
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
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
