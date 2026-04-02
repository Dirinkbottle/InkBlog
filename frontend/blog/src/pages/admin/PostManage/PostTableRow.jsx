import React from 'react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Edit, Trash2, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function PostTableRow({ post, onDelete, onPublish, navigate }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="p-4">
        <div className="font-medium text-slate-900">{post.title}</div>
        <div className="text-sm text-slate-500 line-clamp-1">
          {post.summary}
        </div>
      </td>
      <td className="p-4">
        {post.category ? (
          <Badge 
            variant="secondary"
            className="bg-blue-100 text-blue-700 font-medium"
          >
            {post.category.name}
          </Badge>
        ) : (
          <span className="text-slate-500 text-sm">未分类</span>
        )}
      </td>
      <td className="p-4">
        {post.status === 'published' ? (
          <Badge className="bg-green-100 text-green-700 font-medium">
            ✓ 已发布
          </Badge>
        ) : (
          <Badge 
            variant="outline"
            className="border-orange-300 text-orange-600 font-medium"
          >
            ○ 草稿
          </Badge>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center text-sm text-slate-500">
          <Eye className="h-4 w-4 mr-1" />
          {post.views}
        </div>
      </td>
      <td className="p-4 text-sm text-slate-500">
        {formatDate(post.created_at)}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/posts/${post.id}`)}
            className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          >
            查看
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/posts/${post.id}/edit`)}
            aria-label={`编辑文章 ${post.title}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {post.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPublish(post.id)}
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
            >
              发布
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(post.id)}
            aria-label={`删除文章 ${post.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
