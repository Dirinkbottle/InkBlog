import React, { useState, useEffect, useRef, useCallback } from 'react'
import PostCard from './PostCard'
import { FileText } from 'lucide-react'

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
          <div key={i} className="space-y-4 animate-pulse rounded-xl border border-slate-200 bg-white p-4">
            <div className="h-40 w-full rounded-lg bg-slate-100" />
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-14 border border-dashed border-slate-300 rounded-xl bg-white">
        <FileText className="mx-auto h-8 w-8 text-slate-300 mb-3" />
        <p className="text-slate-600">暂无文章</p>
        <p className="text-sm text-slate-400 mt-1">稍后回来看看，或尝试其他筛选条件。</p>
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
