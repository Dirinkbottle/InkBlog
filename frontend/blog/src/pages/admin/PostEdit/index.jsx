import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { adminAPI } from '@/services/api'
import AttachmentManager from '@/components/post/AttachmentManager'
import { usePostEditor } from './usePostEditor'
import EditorSection from './EditorSection'
import SettingsPanel from './SettingsPanel'

export default function PostEdit() {
  const navigate = useNavigate()
  const {
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
  } = usePostEditor(navigate)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{isEditMode ? '编辑文章' : '新建文章'}</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/admin/posts')}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <EditorSection
            title={title}
            setTitle={setTitle}
            content={content}
            setContent={setContent}
            handleImageUpload={handleImageUpload}
          />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <SettingsPanel
            summary={summary}
            setSummary={setSummary}
            coverImage={coverImage}
            setCoverImage={setCoverImage}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            categories={categories}
            tags={tags}
            selectedTags={selectedTags}
            handleToggleTag={handleToggleTag}
          />
        </div>
      </div>

      <AttachmentManager postId={id ? parseInt(id) : null} isAdmin={true} api={adminAPI} />
    </div>
  )
}
