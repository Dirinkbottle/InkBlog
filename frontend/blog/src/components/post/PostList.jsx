import React, { useState, useEffect, useRef, useCallback } from 'react'
import PostCard from './PostCard'
import { Skeleton } from '../ui/skeleton'

function AnimatedCard({ children, index }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || hasAnimated) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          // 交错延迟：每个卡片间隔 80ms
          const delay = (index % 3) * 80
          setTimeout(() => {
            setVisible(true)
            setHasAnimated(true)
          }, delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.unobserve(el)
  }, [index, hasAnimated])

  return (
    <div
      ref={ref}
      className="transition-all duration-500 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      {visible || hasAnimated ? children : <div className="h-96" />}
    </div>
  )
}

export default function PostList({ posts, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4 animate-pulse">
            <div className="h-48 w-full rounded-lg bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无文章</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post, index) => (
        <AnimatedCard key={post.id} index={index}>
          <PostCard post={post} />
        </AnimatedCard>
      ))}
    </div>
  )
}
