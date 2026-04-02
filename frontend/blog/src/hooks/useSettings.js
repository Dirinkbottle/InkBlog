import { useQuery } from '@tanstack/react-query'
import { settingAPI } from '@/services/api'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingAPI.getAll()
      return res.data || {}
    },
    staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
  })
}

export function useSetting(key, defaultValue = '') {
  const { data: settings = {} } = useSettings()
  return settings[key] ?? defaultValue
}
