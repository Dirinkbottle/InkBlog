import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '@/services/api'
import useAuthStore from '@/store/authStore'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function UserPostManage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)

  // 获取用户文章列表
  const { data, isLoading } = useQuery({
    queryKey: ['user-posts', page],
    queryFn: () => userAPI.getPostList({ page, page_size: 10 }),
  })

  // 删除文章
  const deletePostMutation = useMutation({
    mutationFn: (id) => userAPI.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
    },
  })

  // 发布文章
  const publishPostMutation = useMutation({
    mutationFn: (id) => userAPI.publishPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
    },
  })

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这篇文章吗？')) {
      try {
        await deletePostMutation.mutateAsync(id)
        alert('删除成功')
      } catch (error) {
        alert(error.message || '删除失败')
      }
    }
  }

  const handlePublish = async (id) => {
    try {
      await publishPostMutation.mutateAsync(id)
      alert('发布成功')
    } catch (error) {
      alert(error.message || '发布失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的文章</h1>
          <p className="text-muted-foreground mt-2">管理您的文章</p>
        </div>
        <Button onClick={() => navigate('/user/posts/new')}>
          <Plus className="h-4 w-4 mr-2" />
          新建文章
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">加载中...</div>
          ) : !data?.data?.posts || data.data.posts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">暂无文章</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">标题</th>
                    <th className="p-4 font-medium">分类</th>
                    <th className="p-4 font-medium">状态</th>
                    <th className="p-4 font-medium">浏览</th>
                    <th className="p-4 font-medium">创建时间</th>
                    <th className="p-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.posts.map((post) => (
                    <tr key={post.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{post.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {post.summary}
                        </div>
                      </td>
                      <td className="p-4">
                        {post.category ? (
                          <Badge variant="secondary">{post.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">未分类</span>
                        )}
                      </td>
                      <td className="p-4">
                        {post.status === 'published' ? (
                          <Badge>已发布</Badge>
                        ) : (
                          <Badge variant="outline">草稿</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-muted-foreground">
                          <Eye className="h-4 w-4 mr-1" />
                          {post.views}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(post.created_at)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/user/posts/${post.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {post.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePublish(post.id)}
                              disabled={publishPostMutation.isPending}
                            >
                              发布
                            </Button>
                          )}
                          {(user?.permissions?.can_delete_post || user?.role === 'admin') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(post.id)}
                              disabled={deletePostMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {data?.data && data.data.total_page > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            上一页
          </Button>
          <span className="flex items-center px-4">
            第 {page} / {data.data.total_page} 页
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= data.data.total_page}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}

