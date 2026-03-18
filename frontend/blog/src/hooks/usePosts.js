import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postAPI, adminAPI } from '../services/api'

export function usePosts(params = {}) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => postAPI.getList(params),
    staleTime: 1000 * 60 * 5, // 5分钟
  })
}

export function usePost(id) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => postAPI.getById(id),
    enabled: !!id,
  })
}

export function usePostBySlug(slug) {
  return useQuery({
    queryKey: ['post', 'slug', slug],
    queryFn: () => postAPI.getBySlug(slug),
    enabled: !!slug,
  })
}

// 管理员相关 hooks
export function useAdminPosts(params = {}) {
  return useQuery({
    queryKey: ['admin', 'posts', params],
    queryFn: () => adminAPI.getPostList(params),
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminAPI.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => adminAPI.updatePost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminAPI.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function usePublishPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminAPI.publishPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useUploadImage() {
  return useMutation({
    mutationFn: adminAPI.uploadImage,
  })
}

