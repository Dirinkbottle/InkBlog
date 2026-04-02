import React, { useState } from 'react'
import { Button } from '../../ui/button'
import { Send } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CommentForm({ isAuthenticated, user, onSubmit, submitting }) {
  const [text, setText] = useState('')
  const trimmed = text.trim()
  const maxLength = 1000

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!trimmed) return
    onSubmit(trimmed)
    setText('')
  }

  if (!isAuthenticated || !user?.permissions?.can_comment) {
    return (
      <div className="mb-6 p-4 border rounded-lg bg-muted/30 text-center">
        {!isAuthenticated ? (
          <p className="text-sm text-muted-foreground">
            请先{' '}
            <Link to="/login" className="text-primary hover:underline">
              登录
            </Link>{' '}
            后再发表评论
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            您的账号暂无评论权限
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <textarea
        className="w-full px-4 py-3 border border-slate-300 rounded-lg resize-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
        rows="4"
        placeholder="写下你的评论..."
        value={text}
        maxLength={maxLength}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-400">{trimmed.length}/{maxLength}</span>
        <Button type="submit" disabled={submitting || !trimmed}>
          <Send className="h-4 w-4 mr-2" />
          {submitting ? '发送中...' : '发表评论'}
        </Button>
      </div>
    </form>
  )
}
