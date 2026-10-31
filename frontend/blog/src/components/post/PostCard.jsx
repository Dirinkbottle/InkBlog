import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Eye, MessageSquare } from 'lucide-react'
import { dateLabel } from '../../lib/reading'
import BookmarkButton from '../reader/BookmarkButton'

export default function PostCard({ post, featured = false }) {
  const [failedCover, setFailedCover] = useState(false)
  const tone = Number(post.id || 0) % 4
  return (
    <article className={`post-card ${featured ? 'featured-post' : ''}`}>
      <Link
        to={`/posts/${post.id}`}
        className={`post-cover cover-tone-${tone}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        {post.cover_image && !failedCover ? (
          <img
            src={post.cover_image}
            alt=""
            loading="lazy"
            onError={() => setFailedCover(true)}
          />
        ) : (
          <div className="cover-art">
            <span className="cover-orbit" />
            <span className="cover-orbit second" />
            <span className="cover-symbol">
              {['{ }', 'Aa', '⌘', '∞'][tone]}
            </span>
            <span className="cover-caption">
              {post.category?.name || 'IDEAS & NOTES'}
            </span>
            <span className="cover-index">
              INK / {String(post.id).padStart(3, '0')}
            </span>
          </div>
        )}
        {featured && (
          <span className="featured-label">最新一篇 · NEW ENTRY</span>
        )}
        <span className="cover-arrow">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <div className="post-card-body">
        <div className="post-card-meta">
          {post.category ? (
            <Link to={`/posts?category=${post.category.id}`}>
              {post.category.name}
            </Link>
          ) : (
            <span>随笔</span>
          )}
          <span className="meta-dot">·</span>
          <time dateTime={post.published_at || post.created_at}>
            {dateLabel(post)}
          </time>
        </div>
        <h2>
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </h2>
        <p className="post-excerpt">
          {post.summary || '打开这篇文章，发现文字背后的思考。'}
        </p>
        <div className="post-tags">
          {post.tags?.slice(0, 3).map((tag) => (
            <Link key={tag.id} to={`/posts?tag=${tag.id}`}>
              # {tag.name}
            </Link>
          ))}
        </div>
        <div className="post-card-bottom">
          <span className="post-author">
            <span className="author-avatar">
              {post.author?.username?.charAt(0).toUpperCase() || 'I'}
            </span>
            {post.author?.username || '佚名'}
          </span>
          <span className="post-metrics">
            <span title="阅读次数">
              <Eye size={13} />
              {post.views || 0}
            </span>
            <span title="评论数">
              <MessageSquare size={13} />
              {post.comment_count || 0}
            </span>
          </span>
          <BookmarkButton post={post} compact />
        </div>
      </div>
    </article>
  )
}
