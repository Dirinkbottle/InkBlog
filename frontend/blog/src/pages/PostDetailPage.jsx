import React from 'react'
import { useParams } from 'react-router-dom'
import ReadingView from '../components/reader/ReadingView'
import QueryState from '../components/discovery/QueryState'
import SEO from '../components/SEO'
import { usePost } from '@/hooks/usePosts'
import { Skeleton } from '../components/ui/skeleton'

export default function PostDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error, refetch } = usePost(id)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (error || !data?.data) {
    const notFound = error?.code === 404 || error?.response?.status === 404
    return (
      <div className="site-width page-space">
        <SEO title={notFound ? '文章不存在' : '文章加载失败'} />
        <QueryState
          error={!notFound}
          retry={refetch}
          title="这篇文章暂时无法访问"
          description="文章可能已被删除或尚未发布，去看看其他文字吧。"
        />
      </div>
    )
  }

  return (
    <>
      <SEO
        title={data.data.title}
        description={data.data.summary || data.data.content?.substring(0, 150)}
        keywords={data.data.tags?.map((t) => t.name).join(',')}
      />
      <ReadingView key={data.data.id} post={data.data} />
    </>
  )
}
