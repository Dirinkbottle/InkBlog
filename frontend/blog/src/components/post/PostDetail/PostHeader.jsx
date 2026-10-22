import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Eye, User, Clock } from 'lucide-react'
import { estimateReadingTime } from '@/lib/utils'
import { dateLabel } from '../../../lib/reading'

export default function PostHeader({ post }) {
  return (
    <>
      <div className="article-meta">
        {post.author ? (
          <Link to={`/users/${post.author.id}`}>
            <User size={13} />
            {post.author.username}
          </Link>
        ) : (
          <span>
            <User size={13} />
            佚名
          </span>
        )}
        <span>
          <Calendar size={13} />
          <time dateTime={post.published_at || post.created_at}>
            {dateLabel(post)}
          </time>
        </span>
        <span>
          <Eye size={13} />
          {post.views || 0} 次阅读
        </span>
        <span>
          <Clock size={13} />约 {estimateReadingTime(post.content)} 分钟
        </span>
      </div>
      <div className="article-tags">
        {post.category && (
          <Link to={`/posts?category=${post.category.id}`}>
            {post.category.name}
          </Link>
        )}
        {post.tags?.map((tag) => (
          <Link key={tag.id} to={`/posts?tag=${tag.id}`}>
            # {tag.name}
          </Link>
        ))}
      </div>
    </>
  )
}
