import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Welcome from './pages/Welcome'
import Posts from './pages/Posts'
import Login from './pages/Login'
import Register from './pages/Register'
import PostDetailPage from './pages/PostDetailPage'
import Install from './pages/Install'
import UserSettings from './pages/UserSettings'
import Search from './pages/Search'
import NotFound from './pages/NotFound'
import VerifyEmailWaiting from './pages/VerifyEmailWaiting'
import VerifyEmailSuccess from './pages/VerifyEmailSuccess'
import UserProfile from './pages/UserProfile/index'
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import DataBoard from './pages/admin/DataBoard'
import PostManage from './pages/admin/PostManage'
import PostEdit from './pages/admin/PostEdit'
import CategoryManage from './pages/admin/CategoryManage'
import TagManage from './pages/admin/TagManage'
import UserManage from './pages/admin/UserManage'
import CommentManage from './pages/admin/CommentManage'
import SiteSettings from './pages/admin/SiteSettings'
import ServiceManagement from './pages/admin/ServiceManagement'
import UserLayout from './components/user/UserLayout'
import UserPostManage from './pages/user/UserPostManage'
import UserPostEdit from './pages/user/UserPostEdit'
import { Toaster } from './components/ui/sonner'
import ScrollToTop from './components/ui/scroll-to-top'
import ErrorBoundary from './components/error/ErrorBoundary'
import ErrorToastContainer from './components/error/ErrorToastContainer'
import SuccessToastContainer from './components/success/SuccessToastContainer'
import NotificationProvider from './components/notifications/NotificationProvider'
import { setupGlobalErrorHandler } from './utils/globalErrorHandler'
import { setupAlertHook } from './utils/alertHook'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// 安装状态检查组件
function InstallChecker({ children }) {
  const [installChecked, setInstallChecked] = useState(false)
  const [isInstalled, setIsInstalled] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/v1/install/status')
      .then(res => {
        const installed = res.data?.data?.installed || false
        setIsInstalled(installed)
        if (!installed && window.location.pathname !== '/install') {
          navigate('/install', { replace: true })
        }
      })
      .catch(() => setIsInstalled(true))
      .finally(() => setInstallChecked(true))
  }, [navigate])

  if (!installChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isInstalled) {
    return children
  }

  return <NotificationProvider>{children}</NotificationProvider>
}

// Welcome 路由守卫：已访问过则直接跳转 /posts
function WelcomeGuard() {
  if (sessionStorage.getItem('inkblog_visited')) {
    return <Navigate to="/posts" replace />
  }
  return <Welcome />
}

function App() {
  useEffect(() => {
    setupGlobalErrorHandler()
    setupAlertHook()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <InstallChecker>
            <Routes>
          {/* 欢迎页（无 Header/Footer） */}
          <Route path="/" element={<WelcomeGuard />} />

          {/* 公共路由 */}
          <Route path="/install" element={<Install />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route
            path="/*"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/posts" element={<Posts />} />
                    <Route path="/posts/:id" element={<PostDetailPage />} />
                    <Route path="/users/:id" element={<UserProfile />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email-waiting" element={<VerifyEmailWaiting />} />
                    <Route path="/verify-email" element={<VerifyEmailSuccess />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <ScrollToTop />
              </div>
            }
          />

          {/* 用户路由 */}
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<UserPostManage />} />
            <Route path="posts" element={<UserPostManage />} />
            <Route path="posts/new" element={<UserPostEdit />} />
            <Route path="posts/:id/edit" element={<UserPostEdit />} />
          </Route>

          {/* 管理员路由 */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="databoard" element={<DataBoard />} />
            <Route path="services/:serviceId" element={<ServiceManagement />} />
            <Route path="posts" element={<PostManage />} />
            <Route path="posts/new" element={<PostEdit />} />
            <Route path="posts/:id/edit" element={<PostEdit />} />
            <Route path="categories" element={<CategoryManage />} />
            <Route path="tags" element={<TagManage />} />
            <Route path="users" element={<UserManage />} />
            <Route path="comments" element={<CommentManage />} />
            <Route path="settings" element={<SiteSettings />} />
          </Route>
            </Routes>
            <Toaster />
            <ErrorToastContainer />
            <SuccessToastContainer />
          </InstallChecker>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
