import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MDEditor from '@uiw/react-md-editor'
import rehypeSanitize from 'rehype-sanitize'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useCategories, useTags } from '@/hooks/useCategories'
import { userAPI } from '@/services/api'
import { generateSummary } from '@/lib/utils'
import AttachmentManager from '@/components/post/AttachmentManager'
import { useErrorToast } from '@/hooks/useErrorToast'
import { shouldShowLocalApiError } from '@/utils/apiErrors'

export default function UserPostEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const editorRef = useRef()
  const isEditMode = !!id
  const { showError } = useErrorToast()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [status, setStatus] = useState('draft')
  const [content, setContent] = useState('')

  // 获取文章数据（编辑模式）
  const { data: postData } = useQuery({
    queryKey: ['user-post', id],
    queryFn: () => userAPI.getPost(id),
    enabled: isEditMode,
  })

  const { data: categoriesData } = useCategories()
  const { data: tagsData } = useTags()

  const categories = categoriesData?.data || []
  const tags = tagsData?.data || []

  // 创建文章
  const createPostMutation = useMutation({
    mutationFn: (data) => userAPI.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
    },
  })

  // 更新文章
  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => userAPI.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] })
      queryClient.invalidateQueries({ queryKey: ['user-post', id] })
    },
  })

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
      setContent(post.content || '')  // 直接设置 content state
    }
  }, [isEditMode, postData])

  // 添加粘贴上传功能
  useEffect(() => {
    const handlePaste = async (event) => {
      const items = event.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault()
          const blob = item.getAsFile()
          if (blob) {
            try {
              const url = await handleImageUpload(blob)
              const markdown = `\n![${blob.name}](${url})\n`
              setContent((prev) => prev + markdown)
            } catch (error) {
              console.error('粘贴图片上传失败:', error)
              showError({ title: '图片上传失败', message: '上传失败，请重试' })
            }
          }
          break
        }
      }
    }

    const editorEl = document.querySelector('.w-md-editor-text-input')
    if (editorEl) {
      editorEl.addEventListener('paste', handlePaste)
      return () => {
        editorEl.removeEventListener('paste', handlePaste)
      }
    }
  }, [])

  // 图片上传处理
  const handleImageUpload = async (blob) => {
    try {
      const response = await userAPI.uploadEditorImage(blob)
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
      navigate('/user/posts')
    } catch (error) {
      if (shouldShowLocalApiError(error)) {
        showError({ title: '操作失败', message: error.message || '操作失败，请重试' })
      }
    }
  }

  const handleTagToggle = (tagId) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isEditMode ? '编辑文章' : '新建文章'}</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate('/user/posts')}>
            取消
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)}>
            保存草稿
          </Button>
          <Button onClick={() => handleSave(true)}>
            {isEditMode ? '更新并发布' : '发布'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题"
            />
          </div>

          {/* 摘要 */}
          <div className="space-y-2">
            <Label htmlFor="summary">摘要（可选）</Label>
            <Input
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="输入文章摘要，留空将自动生成"
            />
          </div>

          {/* 封面图 */}
          <div className="space-y-2">
            <Label htmlFor="coverImage">封面图URL（可选）</Label>
            <Input
              id="coverImage"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* 分类 */}
          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">请选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* 内容编辑器 */}
          <div className="space-y-2">
            <Label>内容</Label>
            <div className="border rounded-lg overflow-hidden">
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={setContent}
                  height={600}
                  previewOptions={{
                    rehypePlugins: [[rehypeSanitize]],
                  }}
                  onDrop={async (event) => {
                    event.preventDefault()
                    const files = event.dataTransfer.files
                    if (files && files.length > 0) {
                      const file = files[0]
                      if (file.type.indexOf('image') !== -1) {
                        try {
                          const url = await handleImageUpload(file)
                          const markdown = `\n![${file.name}](${url})\n`
                          setContent((prev) => prev + markdown)
                        } catch (error) {
                          console.error('拖拽图片上传失败:', error)
                          showError({ title: '图片上传失败', message: '上传失败，请重试' })
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 资源管理 */}
      <AttachmentManager postId={id ? parseInt(id) : null} isAdmin={false} api={userAPI} />
    </div>
  )
}

