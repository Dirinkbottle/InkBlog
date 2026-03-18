import React from 'react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Edit, Trash2, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function PostTableRow({ post, onDelete, onPublish, navigate }) {
  return (
    <tr className="border-b hover:bg-muted/50">
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
              onClick={() => onPublish(post.id)}
            >
              发布
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(post.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
