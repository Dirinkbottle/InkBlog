import React from 'react'
import PostCard from './PostCard'
import QueryState from '../discovery/QueryState'

export default function PostList({ posts, isLoading, view = 'grid' }) {
  if (isLoading)
    return (
      <div
        className={`post-grid ${view === 'list' ? 'post-grid-list' : ''}`}
        aria-label="正在加载文章"
        aria-busy="true"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="post-skeleton">
            <div className="skeleton" />
            <span className="skeleton" />
            <span className="skeleton" />
            <span className="skeleton" />
          </div>
        ))}
      </div>
    )
  if (!posts?.length) return <QueryState />
  return (
    <div className={`post-grid ${view === 'list' ? 'post-grid-list' : ''}`}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
