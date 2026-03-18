import React from 'react'
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { FileText, LogOut, Edit3 } from 'lucide-react'
import { Button } from '../ui/button'
import useAuthStore from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'

export default function UserLayout() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const { logout } = useAuth()

  // 检查是否登录
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 检查是否有创建文章权限（editor 或有权限的用户）
  if (!user?.permissions?.can_create_post && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-destructive">权限不足</h1>
          <p className="text-muted-foreground">您没有创建文章的权限</p>
          <Link to="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    )
  }

  const navItems = [
    { path: '/user/posts', icon: FileText, label: '我的文章' },
  ]

  return (
    <div className="flex h-screen">
      {/* 侧边导航 */}
      <aside className="w-64 border-r bg-card hidden md:flex md:flex-col">
        <div className="p-6 border-b">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            InkBlog
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center space-x-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => logout()}>
            <LogOut className="h-4 w-4 mr-2" />
            登出
          </Button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

