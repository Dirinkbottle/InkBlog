import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PostList from '../components/post/PostList'
import SEO from '../components/SEO'
import StatCard from '../components/StatCard'
import { usePosts } from '@/hooks/usePosts'
import { useSetting } from '@/hooks/useSettings'
import { Button } from '../components/ui/button'
import { FileText, Users, MessageSquare, ArrowRight } from 'lucide-react'
import api from '../services/api'

export default function Home() {
  const [stats, setStats] = useState({ post_count: 0, user_count: 0, comment_count: 0 })
  const heroTitle = useSetting('hero_title', '探索数字前沿')
  const heroDescription = useSetting('hero_description', '这里记录着全栈开发的旅程，分享 Web 技术、架构设计和创新实践')

  const { data, isLoading } = usePosts({
    page: 1,
    page_size: 5,
    status: 'published',
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/statistics')
        setStats(response.data)
      } catch (error) {
        // 静默处理
      }
    }
    fetchStats()
  }, [])

  return (
    <>
      <SEO />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero Section */}
        <div className="relative mb-12 p-8 rounded-xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground">
              {heroDescription}
            </p>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <StatCard icon={<FileText className="h-5 w-5" />} label="文章总数" value={stats.post_count} color="blue" />
          <StatCard icon={<Users className="h-5 w-5" />} label="用户总数" value={stats.user_count} color="purple" />
          <StatCard icon={<MessageSquare className="h-5 w-5" />} label="评论总数" value={stats.comment_count} color="orange" />
        </div>

        {/* 最新文章 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">最新文章</h2>
            <Link to="/posts">
              <Button variant="ghost" className="gap-2">
                查看全部 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <PostList posts={data?.data?.posts} isLoading={isLoading} />
        </div>
      </div>
    </>
  )
}
