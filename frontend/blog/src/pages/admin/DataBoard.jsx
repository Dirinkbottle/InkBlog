import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FileText, MessageSquare, RefreshCcw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminAPI } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { useErrorToast } from '@/hooks/useErrorToast'
import MetricTrendCard from '@/components/admin/databoard/MetricTrendCard'

const STORAGE_KEY = 'inkblog-admin-databoard-chart-modes-v1'
const DEFAULT_MODES = {
  posts: 'line',
  views: 'line',
  users: 'line',
  comments: 'line',
}
const NEXT_MODE = {
  line: 'bar',
  bar: 'hidden',
  hidden: 'line',
}

function loadChartModes() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_MODES
    return { ...DEFAULT_MODES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_MODES
  }
}

export default function DataBoard() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [chartModes, setChartModes] = useState(loadChartModes)
  const { showError } = useErrorToast()

  const fetchOverview = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const response = await adminAPI.getBlogDataOverview()
      setOverview(response.data || null)
    } catch (error) {
      showError({
        title: '博客数据加载失败',
        message: error.message || '无法加载博客数据看板',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchOverview()
  }, [])

  const updateChartMode = (key) => {
    setChartModes((prev) => {
      const next = {
        ...prev,
        [key]: NEXT_MODE[prev[key] || 'line'],
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const metricCards = useMemo(() => {
    const totals = overview?.totals || {}
    const trends = overview?.trends || {}
    const viewsHint = overview?.meta?.views_since
      ? `浏览趋势自 ${overview.meta.views_since} 起统计`
      : '浏览趋势自启用日起统计'

    return [
      {
        key: 'posts',
        title: '总文章数',
        value: loading ? '--' : totals.post_count ?? 0,
        icon: FileText,
        accent: '#111827',
        iconBackground: 'bg-zinc-100',
        points: trends.posts || [],
      },
      {
        key: 'views',
        title: '总浏览量',
        value: loading ? '--' : totals.view_count ?? 0,
        icon: Eye,
        accent: '#0f766e',
        iconBackground: 'bg-emerald-100',
        points: trends.views || [],
        hint: viewsHint,
      },
      {
        key: 'users',
        title: '用户数',
        value: loading ? '--' : totals.user_count ?? 0,
        icon: Users,
        accent: '#1d4ed8',
        iconBackground: 'bg-blue-100',
        points: trends.users || [],
      },
      {
        key: 'comments',
        title: '评论数',
        value: loading ? '--' : totals.comment_count ?? 0,
        icon: MessageSquare,
        accent: '#c2410c',
        iconBackground: 'bg-orange-100',
        points: trends.comments || [],
      },
    ]
  }, [loading, overview])

  const recentPosts = overview?.recent_posts || []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.26em] text-zinc-400">Blog Data</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">博客数据</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            把站点核心统计和最近内容移动到独立数据看板，鼠标悬停卡片即可查看 14 天趋势。
          </p>
        </div>

        <Button
          variant="outline"
          className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
          onClick={() => void fetchOverview({ silent: true })}
          disabled={refreshing}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          {refreshing ? '刷新中...' : '刷新数据'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {metricCards.map((card) => (
          <MetricTrendCard
            key={card.key}
            title={card.title}
            value={card.value}
            icon={card.icon}
            mode={chartModes[card.key] || 'line'}
            onToggleMode={() => updateChartMode(card.key)}
            points={card.points}
            accent={card.accent}
            iconBackground={card.iconBackground}
            hint={card.hint}
          />
        ))}
      </div>

      <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl text-zinc-950">最近文章</CardTitle>
            <p className="text-sm text-zinc-500">保留后台编辑入口，但把展示结构收敛到统一白色看板。</p>
          </div>
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-400">Latest Content</div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-zinc-500">加载中...</div>
          ) : recentPosts.length === 0 ? (
            <div className="text-sm text-zinc-500">暂无文章数据</div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-zinc-200 bg-zinc-50/60 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/admin/posts/${post.id}/edit`}
                      className="block truncate text-lg font-medium text-zinc-950 transition-colors hover:text-zinc-700"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 text-sm text-zinc-500">
                      {post.status === 'published' ? '已发布' : '草稿'} · {formatDate(post.published_at || post.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 text-sm text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      {post.views || 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" />
                      {post.comment_count || 0}
                    </span>
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
