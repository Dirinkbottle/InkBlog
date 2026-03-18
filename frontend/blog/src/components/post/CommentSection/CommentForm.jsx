import React, { useState } from 'react'
import { Button } from '../../ui/button'
import { Send } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CommentForm({ isAuthenticated, user, onSubmit, submitting }) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(text)
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
        className="w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        rows="4"
        placeholder="写下你的评论..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex justify-end mt-2">
        <Button type="submit" disabled={submitting || !text.trim()}>
          <Send className="h-4 w-4 mr-2" />
          {submitting ? '发送中...' : '发表评论'}
        </Button>
      </div>
    </form>
  )
}
