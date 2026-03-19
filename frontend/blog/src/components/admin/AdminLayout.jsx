import React from 'react'
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Settings, LogOut, Folder, Tag, Users, MessageSquare, BarChart3 } from 'lucide-react'
import { Button } from '../ui/button'
import useAuthStore from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'

export default function AdminLayout() {
  const location = useLocation()
  const { user, isAuthenticated } = useAuthStore()
  const { logout } = useAuth()

  // 检查是否登录
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 检查是否是管理员
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-destructive">权限不足</h1>
          <p className="text-muted-foreground">您没有访问管理面板的权限</p>
          <Link to="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    )
  }

  const navItems = [
    {
      path: '/admin',
      icon: LayoutDashboard,
      label: '仪表盘',
      isActive: (pathname) => pathname === '/admin' || pathname.startsWith('/admin/services/'),
    },
    {
      path: '/admin/databoard',
      icon: BarChart3,
      label: '博客数据',
      isActive: (pathname) => pathname === '/admin/databoard',
    },
    {
      path: '/admin/posts',
      icon: FileText,
      label: '文章管理',
      isActive: (pathname) => pathname === '/admin/posts' || pathname.startsWith('/admin/posts/'),
    },
    {
      path: '/admin/categories',
      icon: Folder,
      label: '分类管理',
      isActive: (pathname) => pathname === '/admin/categories' || pathname.startsWith('/admin/categories/'),
    },
    {
      path: '/admin/tags',
      icon: Tag,
      label: '标签管理',
      isActive: (pathname) => pathname === '/admin/tags' || pathname.startsWith('/admin/tags/'),
    },
    {
      path: '/admin/users',
      icon: Users,
      label: '用户管理',
      isActive: (pathname) => pathname === '/admin/users' || pathname.startsWith('/admin/users/'),
    },
    {
      path: '/admin/comments',
      icon: MessageSquare,
      label: '评论管理',
      isActive: (pathname) => pathname === '/admin/comments' || pathname.startsWith('/admin/comments/'),
    },
    {
      path: '/admin/settings',
      icon: Settings,
      label: '网站设置',
      isActive: (pathname) => pathname === '/admin/settings' || pathname.startsWith('/admin/settings/'),
    },
  ]

  return (
    <div className="flex h-screen bg-white">
      {/* 侧边导航 */}
      <aside className="hidden w-72 border-r border-zinc-200 bg-white md:flex md:flex-col">
        <div className="border-b border-zinc-200 p-6">
          <Link to="/" className="text-xl font-semibold tracking-tight text-zinc-950">
            InkBlog Admin
          </Link>
          <p className="mt-2 text-sm text-zinc-500">纯白控制台与独立数据看板</p>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.isActive(location.pathname)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4">
          <div className="mb-4 flex items-center space-x-3 px-4">
            <div className="h-9 w-9 rounded-full bg-zinc-900" />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-950">{user?.username}</p>
              <p className="text-xs text-zinc-500">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            登出
          </Button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

