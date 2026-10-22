import React, { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  X,
  Sun,
  Moon,
  Search,
  LogOut,
  ArrowUpRight,
  Feather,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useThemeStore from '@/store/themeStore'
import { useAuth } from '@/hooks/useAuth'
import { useSetting } from '@/hooks/useSettings'

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/posts', label: '文章' },
  { to: '/archives', label: '归档' },
  { to: '/library', label: '阅读书房' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const { resolvedTheme: theme, toggleTheme } = useThemeStore()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const siteName = useSetting('site_name', 'InkBlog')

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname, location.search])
  useEffect(() => {
    const shortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        navigate('/search')
      }
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [navigate])

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        跳到正文
      </a>
      <div className="site-width header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Feather size={22} />
          </span>
          <span>
            {siteName}
            <small>记录 · 思考 · 生长</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="主导航">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="header-search" to="/search" aria-label="搜索文章">
            <Search size={18} />
            <span>搜索</span>
            <kbd>⌘ K</kbd>
          </Link>
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label="切换明暗主题"
            title="切换明暗主题"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link
            className="header-account"
            to={isAuthenticated ? '/settings' : '/login'}
          >
            {isAuthenticated ? user?.username : '登录'}
            <ArrowUpRight size={15} />
          </Link>
          <button
            className="icon-button mobile-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          className="mobile-navigation site-width"
          aria-label="移动导航"
        >
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
          <Link to={isAuthenticated ? '/settings' : '/login'}>
            {isAuthenticated ? '账户设置' : '登录 / 注册'}
          </Link>
        </nav>
      )}
      {isAuthenticated && (
        <div className="account-strip site-width">
          {user?.role === 'admin' && <Link to="/admin">管理面板 ↗</Link>}
          {user?.permissions?.can_create_post && user?.role !== 'admin' && (
            <Link to="/user/posts">我的文章 ↗</Link>
          )}
          <button onClick={logout}>
            退出登录 <LogOut size={13} />
          </button>
        </div>
      )}
    </header>
  )
}
