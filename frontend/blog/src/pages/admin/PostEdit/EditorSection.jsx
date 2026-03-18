import React, { useEffect } from 'react'
import MDEditor from '@uiw/react-md-editor'
import rehypeSanitize from 'rehype-sanitize'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EditorSection({ title, setTitle, content, setContent, handleImageUpload }) {
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
  }, [handleImageUpload, setContent])

  return (
    <Card>
      <CardHeader>
        <CardTitle>文章内容</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入文章标题"
            className="text-lg"
          />
        </div>

        <div>
          <Label>正文</Label>
          <div className="border rounded-lg overflow-hidden mt-2">
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
  )
}
