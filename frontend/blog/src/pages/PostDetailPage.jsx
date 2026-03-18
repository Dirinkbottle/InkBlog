import React from 'react'
import { useParams } from 'react-router-dom'
import PostDetail from '../components/post/PostDetail/index'
import CommentSection from '../components/post/CommentSection/index'
import SEO from '../components/SEO'
import { usePost } from '@/hooks/usePosts'
import { Skeleton } from '../components/ui/skeleton'

export default function PostDetailPage() {
  const { id } = useParams()
  const { data, isLoading, error } = usePost(id)

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
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">文章未找到</h2>
        <p className="text-muted-foreground">抱歉，您访问的文章不存在或已被删除。</p>
      </div>
    )
  }

  return (
    <>
      <SEO 
        title={data.data.title} 
        description={data.data.summary || data.data.content?.substring(0, 150)} 
        keywords={data.data.tags?.map(t => t.name).join(',')} 
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PostDetail post={data.data} />
        <CommentSection postId={data.data.id} />
      </div>

    </>
  )
}

