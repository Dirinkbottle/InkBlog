import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

function resolveTheme(theme) {
  return theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    : theme === 'dark'
      ? 'dark'
      : 'light'
}

function applyTheme(theme) {
  const resolvedTheme = resolveTheme(theme)
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)
  root.style.colorScheme = resolvedTheme
  return resolvedTheme
}

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: (theme) => {
        const preference = ['light', 'dark', 'system'].includes(theme)
          ? theme
          : 'light'
        set({ theme: preference, resolvedTheme: applyTheme(preference) })
      },
      toggleTheme: () => {
        const next = resolveTheme(get().theme) === 'dark' ? 'light' : 'dark'
        set({ theme: next, resolvedTheme: applyTheme(next) })
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          try {
            return localStorage.getItem(key)
          } catch {
            return null
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value)
          } catch {
            /* Keep the theme in memory. */
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key)
          } catch {
            /* Storage can be unavailable. */
          }
        },
      })),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)

const initTheme = () => {
  useThemeStore.setState({
    resolvedTheme: applyTheme(useThemeStore.getState().theme),
  })
}

if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (useThemeStore.getState().theme === 'system') initTheme()
    })
}

export { initTheme }
export default useThemeStore
