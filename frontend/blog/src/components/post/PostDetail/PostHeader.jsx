import React from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../ui/badge'
import { Calendar, Eye, User, Clock } from 'lucide-react'
import { formatDate, generateColor, estimateReadingTime } from '@/lib/utils'

export default function PostHeader({ post }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center">
          <User className="h-4 w-4 mr-1" />
          {post.author ? (
            <Link 
              to={`/users/${post.author.id}`}
              className="hover:text-primary transition-colors hover:underline"
            >
              {post.author.username}
            </Link>
          ) : (
            <span>佚名</span>
          )}
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{formatDate(post.published_at || post.created_at)}</span>
        </div>
        <div className="flex items-center">
          <Eye className="h-4 w-4 mr-1" />
          <span>{post.views || 0} 次阅读</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          <span>{estimateReadingTime(post.content)} 分钟阅读</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {post.category && <Badge variant="secondary">{post.category.name}</Badge>}
        {post.tags &&
          post.tags.map((tag) => (
            <Badge key={tag.id} className={generateColor(tag.name)} variant="outline">
              {tag.name}
            </Badge>
          ))}
      </div>
    </>
  )
}
