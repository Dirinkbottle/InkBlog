import axios from 'axios'
import { attachClientSessionHeader } from './clientSession'
import useAuthStore from '@/store/authStore'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 防止重复跳转标志
let isRedirecting = false

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const stateToken = useAuthStore.getState().token
    const token = stateToken || localStorage.getItem('token')
    config.headers = attachClientSessionHeader(config.headers || {})
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      // 401 未授权，清除 token 并跳转到登录页
      if (error.response.status === 401 && !isRedirecting) {
        isRedirecting = true
        useAuthStore.getState().logout()
        
        // 只在非登录/注册/安装页面时跳转
        const currentPath = window.location.pathname
        if (!currentPath.match(/\/(login|register|install)/)) {
          window.location.href = '/login'
        }
        
        // 1秒后重置标志
        setTimeout(() => {
          isRedirecting = false
        }, 1000)
      }

      const apiError = {
        ...error.response.data,
        code: error.response.status,
        message: error.response.data?.message || '请求失败，请稍后重试',
        response: {
          status: error.response.status,
          data: error.response.data,
        },
      }

      return Promise.reject(apiError)
    }
    
    return Promise.reject({ message: '网络错误，请稍后重试' })
  }
)

// 认证相关 API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  verifyEmail: (token) => api.get(`/verify-email?token=${token}`),
  resendVerification: (email) => api.post('/resend-verification', { email }),
}

// 文章相关 API
export const postAPI = {
  getList: (params) => api.get('/posts', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  getBySlug: (slug) => api.get(`/posts/slug/${slug}`),
}

// 分类和标签 API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
}

export const tagAPI = {
  getAll: () => api.get('/tags'),
}

// 用户 API（给 editor 和有权限的普通用户）
export const userAPI = {
  // 文章管理（只能管理自己的文章）
  getPostList: (params) => api.get('/user/posts', { params }),
  getPost: (id) => api.get(`/user/posts/${id}`),
  createPost: (data) => api.post('/user/posts', data),
  updatePost: (id, data) => api.put(`/user/posts/${id}`, data),
  deletePost: (id) => api.delete(`/user/posts/${id}`),
  publishPost: (id) => api.patch(`/user/posts/${id}/publish`),
  
  // 文件上传
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/user/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  // Toast UI Editor 图片上传
  uploadEditorImage: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/user/upload/editor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  // 附件管理
  getPostAttachments: (postId) => api.get(`/user/posts/${postId}/attachments`),
  deleteAttachment: (id) => api.delete(`/user/attachments/${id}`),
}

// 管理员 API
export const adminAPI = {
  // 文章管理
  getPostList: (params) => api.get('/admin/posts', { params }),
  createPost: (data) => api.post('/admin/posts', data),
  updatePost: (id, data) => api.put(`/admin/posts/${id}`, data),
  deletePost: (id) => api.delete(`/admin/posts/${id}`),
  publishPost: (id) => api.patch(`/admin/posts/${id}/publish`),
  
  // 分类管理
  getCategories: (params) => api.get('/admin/categories', { params }),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  
  // 标签管理
  getTags: (params) => api.get('/admin/tags', { params }),
  createTag: (data) => api.post('/admin/tags', data),
  updateTag: (id, data) => api.put(`/admin/tags/${id}`, data),
  deleteTag: (id) => api.delete(`/admin/tags/${id}`),
  
  // 用户管理
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  banUser: (id) => api.post(`/admin/users/${id}/ban`),
  unbanUser: (id) => api.post(`/admin/users/${id}/unban`),
  
  // 评论管理
  getComments: (params) => api.get('/admin/comments', { params }),
  getComment: (id) => api.get(`/admin/comments/${id}`),
  approveComment: (id) => api.post(`/admin/comments/${id}/approve`),
  rejectComment: (id) => api.post(`/admin/comments/${id}/reject`),
  deleteComment: (id) => api.delete(`/admin/comments/${id}`),
  
  // 网站设置管理
  getSettings: (params) => api.get('/admin/settings', { params }),
  updateSettings: (data) => api.put('/admin/settings', data),
  getBlogDataOverview: () => api.get('/admin/blog-data/overview'),
  
  // 文件上传
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  // Toast UI Editor 图片上传
  uploadEditorImage: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/admin/upload/editor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  // 附件管理
  getPostAttachments: (postId) => api.get(`/admin/posts/${postId}/attachments`),
  deleteAttachment: (id) => api.delete(`/admin/attachments/${id}`),
}

export const serviceAdminAPI = {
  getSlots: () => api.get('/admin/services'),
  runAction: (serviceId, action) => api.post(`/admin/services/${serviceId}/actions`, { action }),
  getPanel: (serviceId, panelPath, params) => api.get(`/admin/services/${serviceId}/panel/${panelPath}`, { params }),
  postPanel: (serviceId, panelPath, data, params) =>
    api.post(`/admin/services/${serviceId}/panel/${panelPath}`, data, { params }),
}

// 设置 API（公开）
export const settingAPI = {
  getAll: (params) => api.get('/settings', { params }),
}

// 评论 API
export const commentAPI = {
  getPostComments: (postId, params) => api.get(`/comments/post/${postId}`, { params }),
  createComment: (data) => api.post('/comments', data),
}

export default api

