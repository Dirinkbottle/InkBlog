import React, { useState, useEffect, lazy, Suspense } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
const Welcome = lazy(() => import('./pages/Welcome'))
const Archives = lazy(() => import('./pages/Archives'))
const Library = lazy(() => import('./pages/Library'))
import RouteScroll from './components/layout/RouteScroll'
const Posts = lazy(() => import('./pages/Posts'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'))
const Install = lazy(() => import('./pages/Install'))
const UserSettings = lazy(() => import('./pages/UserSettings'))
const Search = lazy(() => import('./pages/Search'))
const NotFound = lazy(() => import('./pages/NotFound'))
const VerifyEmailWaiting = lazy(() => import('./pages/VerifyEmailWaiting'))
const VerifyEmailSuccess = lazy(() => import('./pages/VerifyEmailSuccess'))
const UserProfile = lazy(() => import('./pages/UserProfile/index'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const DataBoard = lazy(() => import('./pages/admin/DataBoard'))
const PostManage = lazy(() => import('./pages/admin/PostManage'))
const PostEdit = lazy(() => import('./pages/admin/PostEdit'))
const CategoryManage = lazy(() => import('./pages/admin/CategoryManage'))
const TagManage = lazy(() => import('./pages/admin/TagManage'))
const UserManage = lazy(() => import('./pages/admin/UserManage'))
const CommentManage = lazy(() => import('./pages/admin/CommentManage'))
const SiteSettings = lazy(() => import('./pages/admin/SiteSettings'))
const ServiceManagement = lazy(() => import('./pages/admin/ServiceManagement'))
const UserLayout = lazy(() => import('./components/user/UserLayout'))
const UserPostManage = lazy(() => import('./pages/user/UserPostManage'))
const UserPostEdit = lazy(() => import('./pages/user/UserPostEdit'))
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
    axios
      .get('/api/v1/install/status')
      .then((res) => {
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

function App() {
  useEffect(() => {
    setupGlobalErrorHandler()
    setupAlertHook()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <RouteScroll />
          <InstallChecker>
            <Suspense
              fallback={
                <div className="site-width page-space" role="status">
                  正在打开页面…
                </div>
              }
            >
              <Routes>
                {/* 公共路由 */}
                <Route path="/install" element={<Install />} />
                <Route path="/settings" element={<UserSettings />} />
                <Route
                  path="/*"
                  element={
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main id="main-content" className="flex-1" tabIndex={-1}>
                        <Suspense
                          fallback={
                            <div
                              className="site-width page-space"
                              role="status"
                            >
                              正在打开页面…
                            </div>
                          }
                        >
                          <Routes>
                            <Route path="/" element={<Welcome />} />
                            <Route path="/archives" element={<Archives />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/posts" element={<Posts />} />
                            <Route
                              path="/posts/:id"
                              element={<PostDetailPage />}
                            />
                            <Route
                              path="/users/:id"
                              element={<UserProfile />}
                            />
                            <Route path="/search" element={<Search />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route
                              path="/verify-email-waiting"
                              element={<VerifyEmailWaiting />}
                            />
                            <Route
                              path="/verify-email"
                              element={<VerifyEmailSuccess />}
                            />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
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
                  <Route
                    path="services/:serviceId"
                    element={<ServiceManagement />}
                  />
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
            </Suspense>
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
