import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { FileText, Eye, Users, MessageSquare } from 'lucide-react'
import { adminAPI } from '@/services/api'
import api from '@/services/api'
import { formatDate } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentPosts, setRecentPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, postsRes] = await Promise.all([
          api.get('/statistics'),
          adminAPI.getPostList({ page: 1, page_size: 5 }),
        ])
        setStats(statsRes.data)
        setRecentPosts(postsRes.data?.posts || [])
      } catch (error) {
        // 静默处理
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { title: '总文章数', value: stats?.post_count ?? '-', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900' },
    { title: '总浏览量', value: stats?.view_count ?? '-', icon: Eye, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' },
    { title: '用户数', value: stats?.user_count ?? '-', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900' },
    { title: '评论数', value: stats?.comment_count ?? '-', icon: MessageSquare, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">仪表盘</h1>
        <p className="text-muted-foreground mt-2">欢迎回来，查看您的博客统计数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{loading ? '-' : stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 最近文章 */}
      <Card>
        <CardHeader>
          <CardTitle>最近文章</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">加载中...</p>
          ) : recentPosts.length === 0 ? (
            <p className="text-muted-foreground">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/admin/posts/${post.id}/edit`}
                      className="text-sm font-medium hover:text-primary transition-colors truncate block"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {post.status === 'published' ? '已发布' : '草稿'} · {formatDate(post.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground ml-4">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{post.comment_count || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
