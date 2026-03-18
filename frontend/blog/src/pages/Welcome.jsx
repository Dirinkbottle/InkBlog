import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { ArrowRight } from 'lucide-react'
import api from '../services/api'

export default function Welcome() {
  const [stats, setStats] = useState(null)
  const [purpose, setPurpose] = useState('')
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  // 入场动画
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  // 获取统计信息和建站初衷
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await api.get('/statistics')
        setStats(statsRes.data)
        const settingsRes = await api.get('/settings', { params: { group: 'site' } })
        const settings = settingsRes.data || []
        const purposeSetting = settings.find(s => s.key === 'site_purpose')
        setPurpose(purposeSetting?.value || '记录技术成长，分享开发经验')
      } catch (error) {
        // 静默处理
      }
    }
    fetchData()
  }, [])

  // 3 秒后自动跳转（已访问过则跳过 Welcome）
  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem('inkblog_visited', '1')
      navigate('/posts')
    }, 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  const handleEnter = () => {
    sessionStorage.setItem('inkblog_visited', '1')
    navigate('/posts')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center p-4">
      <div
        className="transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <Card className="w-full max-w-md backdrop-blur-sm bg-background/80 shadow-2xl">
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              InkBlog
            </h1>

            <div className="space-y-2 text-muted-foreground">
              <p className="text-lg">
                <span className="font-semibold text-foreground">{stats?.user_count || 0}</span> 位用户
              </p>
              <p className="text-lg">
                <span className="font-semibold text-foreground">{stats?.post_count || 0}</span> 篇文章
              </p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">建站初衷</p>
              <p className="text-base italic text-foreground">{purpose}</p>
            </div>

            <Button onClick={handleEnter} className="gap-2">
              进入博客 <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground">3 秒后自动跳转...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
