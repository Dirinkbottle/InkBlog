import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Plus } from 'lucide-react'
import { useAdminPosts, useDeletePost, usePublishPost } from '@/hooks/usePosts'
import { useErrorToast } from '@/hooks/useErrorToast'
import { shouldShowLocalApiError } from '@/utils/apiErrors'
import PostTable from './PostTable'
import Pagination from './Pagination'

export default function PostManage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAdminPosts({ page, page_size: 10 })
  const deletePostMutation = useDeletePost()
  const publishPostMutation = usePublishPost()
  const { showError } = useErrorToast()

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      try {
        await deletePostMutation.mutateAsync(id)
      } catch (error) {
        if (shouldShowLocalApiError(error)) {
          showError({ title: '删除失败', message: error.message || '删除失败，请重试' })
        }
      }
    }
  }

  const handlePublish = async (id) => {
    try {
      await publishPostMutation.mutateAsync(id)
    } catch (error) {
      if (shouldShowLocalApiError(error)) {
        showError({ title: '发布失败', message: error.message || '发布失败，请重试' })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">文章管理</h1>
          <p className="text-muted-foreground mt-2">管理您的所有文章</p>
        </div>
        <Button onClick={() => navigate('/admin/posts/new')}>
          <Plus className="h-4 w-4 mr-2" />
          新建文章
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <PostTable
            posts={data?.data?.posts}
            isLoading={isLoading}
            onDelete={handleDelete}
            onPublish={handlePublish}
            navigate={navigate}
          />
        </CardContent>
      </Card>

      <Pagination
        page={page}
        totalPages={data?.data?.total_pages}
        setPage={setPage}
      />
    </div>
  )
}
