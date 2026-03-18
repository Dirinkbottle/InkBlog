import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { useAdminPosts, useDeletePost, usePublishPost } from '@/hooks/usePosts'
import { formatDate } from '@/lib/utils'
import { useErrorToast } from '@/hooks/useErrorToast'
import { shouldShowLocalApiError } from '@/utils/apiErrors'

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
                          <Badge 
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-medium"
                          >
                            {post.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">未分类</span>
                        )}
                      </td>
                      <td className="p-4">
                        {post.status === 'published' ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 font-medium">
                            ✓ 已发布
                          </Badge>
                        ) : (
                          <Badge 
                            variant="outline"
                            className="border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400 font-medium"
                          >
                            ○ 草稿
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center text-sm text-muted-foreground">
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
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/posts/${post.id}`)}
                          >
                            查看
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/posts/${post.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {post.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePublish(post.id)}
                            >
                              发布
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
      {data?.data && data.data.total_pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page <= 1}>
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {data.data.total_pages} 页
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= data.data.total_pages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}

