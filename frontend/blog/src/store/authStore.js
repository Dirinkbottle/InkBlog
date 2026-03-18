import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      // 登录
      login: (userData, tokenData, refreshTokenData) => {
        localStorage.setItem('token', tokenData)
        localStorage.setItem('refreshToken', refreshTokenData)
        set({
          user: userData,
          token: tokenData,
          refreshToken: refreshTokenData,
          isAuthenticated: true,
        })
      },

      // 登出
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('auth-storage') // 清除 zustand persist 缓存
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      // 更新用户信息
      updateUser: (userData) => {
        set({ user: userData })
      },

      // 更新 token
      updateToken: (tokenData) => {
        localStorage.setItem('token', tokenData)
        set({ token: tokenData })
      },

      // 检查是否是管理员
      isAdmin: () => {
        const state = useAuthStore.getState()
        return state.user?.role === 'admin'
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore

