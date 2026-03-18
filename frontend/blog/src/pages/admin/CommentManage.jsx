import React, { useState, useEffect } from 'react'
import { Search, Trash2, Loader2, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminAPI } from '@/services/api'
import { useErrorToast } from '@/hooks/useErrorToast'
import { shouldShowLocalApiError } from '@/utils/apiErrors'

export default function CommentManage() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const { showError } = useErrorToast()

  // 获取评论列表
  const fetchComments = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
      }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      
      const res = await adminAPI.getComments(params)
      setComments(res.data.list || [])
      setPagination({
        ...pagination,
        total: res.data.total || 0,
      })
    } catch (error) {
      console.error('获取评论列表失败:', error)
      showError({ title: '加载失败', message: error.message || '获取评论列表失败' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [search, statusFilter, pagination.page])

  // 审核通过
  const handleApprove = async (id) => {
    try {
      await adminAPI.approveComment(id)
      fetchComments()
    } catch (error) {
      console.error('审核失败:', error)
      if (shouldShowLocalApiError(error)) {
        showError({ title: '审核失败', message: error.message || '审核失败，请重试' })
      }
    }
  }

  // 拒绝评论
  const handleReject = async (id) => {
    if (!confirm('确定要拒绝这条评论吗？')) return
    
    try {
      await adminAPI.rejectComment(id)
      fetchComments()
    } catch (error) {
      console.error('操作失败:', error)
      if (shouldShowLocalApiError(error)) {
        showError({ title: '操作失败', message: error.message || '操作失败，请重试' })
      }
    }
  }

  // 删除评论
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条评论吗？此操作不可恢复！')) return
    
    try {
      await adminAPI.deleteComment(id)
      fetchComments()
    } catch (error) {
      console.error('删除失败:', error)
      if (shouldShowLocalApiError(error)) {
        showError({ title: '删除失败', message: error.message || '删除失败，请重试' })
      }
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    const labels = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
    }
    return {
      style: styles[status] || styles.pending,
      label: labels[status] || status,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">评论管理</h1>
      </div>

      {/* 筛选 */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索评论内容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-3 py-2 border rounded-md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无评论
            </div>
          ) : (
            comments.map((comment) => {
              const statusBadge = getStatusBadge(comment.status)
              return (
                <div
                  key={comment.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div>
                        <span className="font-medium">
                          {comment.user?.username || '匿名用户'}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          评论于: {comment.post?.title || '未知文章'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusBadge.style}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-3 bg-muted/30 p-3 rounded">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                    </span>
                    <div className="flex space-x-2">
                      {comment.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(comment.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(comment.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1 text-orange-600" />
                            拒绝
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* 分页 */}
      {pagination.total > pagination.pageSize && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {pagination.page} 页，共 {Math.ceil(pagination.total / pagination.pageSize)} 页
          </span>
          <Button
            variant="outline"
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}

