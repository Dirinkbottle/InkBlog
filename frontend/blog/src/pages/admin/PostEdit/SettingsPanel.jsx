import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPanel({
  summary,
  setSummary,
  coverImage,
  setCoverImage,
  categoryId,
  setCategoryId,
  categories,
  tags,
  selectedTags,
  handleToggleTag,
}) {
  const summaryLimit = 400

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-900">文章设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="summary">摘要</Label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="留空将自动生成"
            className="w-full h-24 px-3 py-2 text-sm rounded-md border border-slate-300 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-sky-400"
            maxLength={summaryLimit}
          />
          <p className="mt-1 text-xs text-slate-500">{summary.length}/{summaryLimit}</p>
        </div>

        <div>
          <Label htmlFor="coverImage">封面图 URL</Label>
          <Input
            id="coverImage"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
            className="border-slate-300 bg-white"
          />
        </div>

        <div>
          <Label htmlFor="category">分类 <span className="text-destructive">*</span></Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-10 px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>标签</Label>
          <p className="text-xs text-slate-500 mt-1">已选 {selectedTags.length} 个标签</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleTag(tag.id)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
