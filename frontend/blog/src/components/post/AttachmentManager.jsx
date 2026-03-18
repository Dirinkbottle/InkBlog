import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'

export default function AttachmentManager({ postId, isAdmin, api }) {
  const queryClient = useQueryClient()
  const [copiedId, setCopiedId] = useState(null)

  // 获取附件列表
  const { data: attachmentsData, isLoading } = useQuery({
    queryKey: ['attachments', postId],
    queryFn: () => api.getPostAttachments(postId),
    enabled: !!postId,
  })

  const attachments = attachmentsData?.data || []

  // 删除附件
  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', postId] })
    },
  })

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url)
    setCopiedId(url)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = (attachment) => {
    if (window.confirm(`确定要删除 "${attachment.file_name}" 吗？`)) {
      deleteMutation.mutate(attachment.id)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!postId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>资源管理</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            保存文章后可查看已上传的资源
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>资源管理</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>资源管理 ({attachments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无上传的资源</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="border rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                {/* 预览图 */}
                {attachment.file_type.startsWith('image/') ? (
                  <div className="aspect-video bg-muted rounded-md mb-2 overflow-hidden">
                    <img
                      src={attachment.file_url}
                      alt={attachment.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center">
                    <span className="text-4xl">📄</span>
                  </div>
                )}

                {/* 文件信息 */}
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate" title={attachment.file_name}>
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(attachment.created_at)}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyUrl(attachment.file_url)}
                    className="flex-1 text-xs"
                  >
                    {copiedId === attachment.file_url ? '已复制' : '复制URL'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(attachment)}
                    disabled={deleteMutation.isPending}
                    className="text-xs"
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

