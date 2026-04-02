import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon, Search, User, LogOut, Edit3 } from 'lucide-react'
import { Button } from '../ui/button'
import useAuthStore from '@/store/authStore'
import useThemeStore from '@/store/themeStore'
import { useAuth } from '@/hooks/useAuth'
import { useSetting } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/posts', label: '文章' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const siteName = useSetting('site_name', 'InkBlog')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 transition-shadow duration-300',
      scrolled && 'shadow-sm'
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/posts" className="flex items-center space-x-2">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {siteName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive(to)
                    ? 'text-sky-700 bg-sky-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={() => navigate('/search')}>
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {user?.role === 'admin' && (
                  <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => navigate('/admin')}>
                    管理面板
                  </Button>
                )}
                {user?.permissions?.can_create_post && user?.role !== 'admin' && (
                  <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => navigate('/user/posts')}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    我的文章
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900 hover:bg-slate-100" onClick={() => navigate('/settings')}>
                  <User className="h-4 w-4 mr-2" />
                  {user?.username}
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={() => logout()}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => navigate('/login')}>登录</Button>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileMenuOpen ? 'max-h-96 opacity-100 pb-4 border-t' : 'max-h-0 opacity-0'
        )}>
          <nav className="flex flex-col space-y-1 pt-4">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive(to)
                    ? 'text-sky-700 bg-sky-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}

            <div className="pt-4 border-t border-slate-200 flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {isAuthenticated ? (
                <>
                  {user?.role === 'admin' && (
                    <Button
                      size="sm"
                      className="bg-slate-900 text-white hover:bg-slate-800"
                      onClick={() => { navigate('/admin'); setMobileMenuOpen(false) }}
                    >
                      管理面板
                    </Button>
                  )}
                  {user?.permissions?.can_create_post && user?.role !== 'admin' && (
                    <Button
                      size="sm"
                      className="bg-slate-900 text-white hover:bg-slate-800"
                      onClick={() => { navigate('/user/posts'); setMobileMenuOpen(false) }}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      我的文章
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    onClick={() => { navigate('/settings'); setMobileMenuOpen(false) }}
                  >
                    {user?.username}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100" onClick={() => logout()}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}>
                  登录
                </Button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
