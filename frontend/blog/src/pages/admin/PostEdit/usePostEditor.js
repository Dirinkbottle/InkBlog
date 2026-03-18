import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usePost, useCreatePost, useUpdatePost } from '@/hooks/usePosts'
import { useCategories, useTags } from '@/hooks/useCategories'
import { adminAPI } from '@/services/api'
import { generateSummary } from '@/lib/utils'
import { useErrorToast } from '@/hooks/useErrorToast'
import { shouldShowLocalApiError } from '@/utils/apiErrors'

export function usePostEditor(navigate) {
  const { id } = useParams()
  const isEditMode = !!id
  const { showError } = useErrorToast()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [status, setStatus] = useState('draft')
  const [content, setContent] = useState('')

  const { data: postData } = usePost(id)
  const { data: categoriesData } = useCategories()
  const { data: tagsData } = useTags()
  const createPostMutation = useCreatePost()
  const updatePostMutation = useUpdatePost()

  const categories = categoriesData?.data || []
  const tags = tagsData?.data || []

  // 设置默认分类
  useEffect(() => {
    if (!isEditMode && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id.toString())
    }
  }, [isEditMode, categories, categoryId])

  // 加载现有文章数据
  useEffect(() => {
    if (isEditMode && postData?.data) {
      const post = postData.data
      setTitle(post.title)
      setSummary(post.summary)
      setCoverImage(post.cover_image || '')
      setCategoryId(post.category_id ? post.category_id.toString() : '')
      setSelectedTags(post.tags?.map((t) => t.id) || [])
      setStatus(post.status)
      setContent(post.content || '')
    }
  }, [isEditMode, postData])

  const handleImageUpload = async (blob) => {
    try {
      const response = await adminAPI.uploadEditorImage(blob)
      return response.url
    } catch (error) {
      console.error('Image upload failed:', error)
      showError({
        title: '图片上传失败',
        message: error.message || '上传失败，请重试'
      })
      return ''
    }
  }

  const handleSave = async (publishNow = false) => {
    if (!title.trim()) {
      showError({ title: '验证失败', message: '请输入标题' })
      return
    }

    if (!content.trim()) {
      showError({ title: '验证失败', message: '请输入内容' })
      return
    }

    if (!categoryId || parseInt(categoryId) === 0) {
      showError({ title: '验证失败', message: '请选择分类' })
      return
    }

    const postData = {
      title,
      content,
      summary: summary || generateSummary(content),
      cover_image: coverImage,
      category_id: parseInt(categoryId),
      tag_ids: selectedTags,
      status: publishNow ? 'published' : status,
    }

    try {
      if (isEditMode) {
        await updatePostMutation.mutateAsync({ id, data: postData })
      } else {
        await createPostMutation.mutateAsync(postData)
      }
      navigate('/admin/posts')
    } catch (error) {
      if (shouldShowLocalApiError(error)) {
        showError({ title: '保存失败', message: error.message || '保存失败，请重试' })
      }
    }
  }

  const handleToggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  return {
    id,
    isEditMode,
    title,
    setTitle,
    summary,
    setSummary,
    coverImage,
    setCoverImage,
    categoryId,
    setCategoryId,
    selectedTags,
    content,
    setContent,
    categories,
    tags,
    handleImageUpload,
    handleSave,
    handleToggleTag,
  }
}
