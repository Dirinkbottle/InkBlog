import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PostList from '../components/post/PostList'
import SEO from '../components/SEO'
import { usePosts } from '@/hooks/usePosts'
import { Button } from '../components/ui/button'

export default function Posts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageParam = parseInt(searchParams.get('page') || '1', 10)
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')

  const { data, isLoading } = usePosts({
    page,
    page_size: 12,
    category_id: category,
    tag_id: tag,
    status: 'published',
  })

  useEffect(() => {
    if (pageParam !== page) {
      const params = new URLSearchParams(searchParams)
      params.set('page', page.toString())
      setSearchParams(params, { replace: true })
    }
  }, [pageParam, page, searchParams, setSearchParams])

  const handlePageChange = (newPage) => {
    if (newPage < 1) return
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <SEO title="文章列表" />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">全部文章</h1>
          <p className="text-sm text-slate-500 mt-1">按时间排序，持续更新。</p>
        </div>

        {/* 文章列表 */}
        <PostList posts={data?.data?.posts} isLoading={isLoading} />

        {/* 分页 */}
        {data?.data && data.data.total_pages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2 rounded-lg border border-slate-200 bg-white py-3">
            <Button
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="border-slate-300 text-slate-700"
            >
              上一页
            </Button>
            <span className="text-sm text-slate-500">
              第 {page} / {data.data.total_pages} 页
            </span>
            <Button
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= data.data.total_pages}
              className="border-slate-300 text-slate-700"
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

