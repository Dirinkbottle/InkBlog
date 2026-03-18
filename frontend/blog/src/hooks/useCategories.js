import { useQuery } from '@tanstack/react-query'
import { categoryAPI, tagAPI } from '../services/api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoryAPI.getAll,
    staleTime: 1000 * 60 * 30, // 30分钟
  })
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: tagAPI.getAll,
    staleTime: 1000 * 60 * 30, // 30分钟
  })
}

