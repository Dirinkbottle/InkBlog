import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const navigate = useNavigate()
  const { login, logout, updateUser, isAuthenticated, token, user, isAdmin } = useAuthStore()

  // 获取用户信息
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: authAPI.getProfile,
    enabled: isAuthenticated && !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
  })

  // 当 profile 数据更新时，同步到 authStore
  useEffect(() => {
    if (profile?.data) {
      updateUser(profile.data)
    }
  }, [profile, updateUser])

  // 登录
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: async (data) => {
      // 检查是否需要邮箱验证
      if (data.requires_verification) {
        navigate('/verify-email-waiting', { state: { email: data.email } })
        return
      }
      login(data.data.user, data.data.token, data.data.refresh_token)
      // 立即重新获取 profile 数据
      await refetchProfile()
      navigate('/')
    },
    onError: (error) => {
      const payload = error?.response?.data || error
      // 处理邮箱未验证的情况
      if (payload?.requires_verification) {
        navigate('/verify-email-waiting', { 
          state: { 
            email: payload.email,
            expiry_hours: payload.expiry_hours || 24
          } 
        })
      }
    },
  })

  // 注册
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (data) => {
      // 检查是否需要邮箱验证 - 修正数据路径
      if (data.data?.requires_verification) {
        navigate('/verify-email-waiting', { 
          state: { 
            email: data.data.email,
            expiry_hours: data.data.expiry_hours 
          } 
        })
        return
      }
      // 不需要验证，直接登录
      login(data.data.user, data.data.token, data.data.refresh_token)
      // 立即重新获取 profile 数据
      refetchProfile()
      navigate('/')
    },
  })

  // 登出
  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      logout()
      navigate('/login')
    },
    onError: () => {
      // 即使请求失败也清除本地数据
      logout()
      navigate('/login')
    },
  })

  return {
    user,
    isAuthenticated,
    isAdmin: isAdmin(),
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    profile,
    refetchProfile,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  }
}

