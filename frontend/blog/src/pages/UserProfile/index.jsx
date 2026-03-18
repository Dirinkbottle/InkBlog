import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import api from '@/services/api'
import UserInfoCard from './UserInfoCard'
import UserPostsList from './UserPostsList'

export default function UserProfile() {
  const { id } = useParams()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: userProfile, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => api.get(`/users/${id}`),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', id, page],
    queryFn: () => api.get(`/users/${id}/posts`, { params: { page, page_size: pageSize } }),
  })

  const user = userProfile?.data
  const posts = postsData?.data?.posts || []
  const totalPages = postsData?.data?.total_pages || 1

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">用户未找到</h2>
        <p className="text-muted-foreground">抱歉，您访问的用户不存在。</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <UserInfoCard user={user} />
      <UserPostsList
        posts={posts}
        loading={postsLoading}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </div>
  )
}
