import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Loader2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { adminAPI } from '@/services/api'
import { useErrorToast } from '@/hooks/useErrorToast'
import { shouldShowLocalApiError } from '@/utils/apiErrors'

export default function TagManage() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })
  const { showError } = useErrorToast()

  // 获取标签列表
  const fetchTags = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getTags({ search })
      setTags(res.data.list || [])
    } catch (error) {
      console.error('获取标签列表失败:', error)
      showError({ title: '加载失败', message: error.message || '获取标签列表失败' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTags()
  }, [search])

  // 打开创建对话框
  const handleCreate = () => {
    setEditingTag(null)
    setFormData({
      name: '',
      slug: '',
    })
    setShowDialog(true)
  }

  // 打开编辑对话框
  const handleEdit = (tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      slug: tag.slug,
    })
    setShowDialog(true)
  }

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingTag) {
        await adminAPI.updateTag(editingTag.id, formData)
      } else {
        await adminAPI.createTag(formData)
      }
      setShowDialog(false)
      fetchTags()
    } catch (error) {
      console.error('操作失败:', error)
      if (shouldShowLocalApiError(error)) {
        showError({ title: '操作失败', message: error.message || '操作失败，请重试' })
      }
    }
  }

  // 删除标签
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个标签吗？')) return
    
    try {
      await adminAPI.deleteTag(id)
      fetchTags()
    } catch (error) {
      console.error('删除失败:', error)
      if (shouldShowLocalApiError(error)) {
        showError({ title: '删除失败', message: error.message || '删除失败，请重试' })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">标签管理</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新建标签
        </Button>
      </div>

      {/* 搜索 */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 标签列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              暂无标签
            </div>
          ) : (
            tags.map((tag) => (
              <div
                key={tag.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{tag.name}</h3>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tag)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Slug: {tag.slug}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 创建/编辑对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTag ? '编辑标签' : '新建标签'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTag ? '更新' : '创建'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDialog(false)}
                >
                  取消
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

