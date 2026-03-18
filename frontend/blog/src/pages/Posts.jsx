import React from 'react'
import { useSearchParams } from 'react-router-dom'
import PostList from '../components/post/PostList'
import SEO from '../components/SEO'
import { usePosts } from '@/hooks/usePosts'
import { Button } from '../components/ui/button'

export default function Posts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1', 10)
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')

  const { data, isLoading } = usePosts({
    page,
    page_size: 12,
    category_id: category,
    tag_id: tag,
    status: 'published',
  })

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <SEO title="文章列表" />
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* 文章列表 */}
        <PostList posts={data?.data?.posts} isLoading={isLoading} />

        {/* 分页 */}
        {data?.data && data.data.total_pages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {page} / {data.data.total_pages} 页
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= data.data.total_pages}
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

