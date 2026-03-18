import React from 'react'
import { MessageSquare } from 'lucide-react'
import CommentItem from './CommentItem'
import CommentPagination from './CommentPagination'
import { organizeComments } from './utils'

export default function CommentList({
  comments,
  loading,
  total,
  page,
  totalPages,
  setPage,
  expandedComments,
  setExpandedComments,
  collapsedReplies,
  setCollapsedReplies,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  onReplySubmit,
  submitting,
  isAuthenticated,
  user,
}) {
  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>加载评论中...</p>
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>暂无评论，来抢沙发吧！</p>
      </div>
    )
  }

  const organizedComments = organizeComments(comments)

  return (
    <div className="space-y-4">
      {organizedComments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          expandedComments={expandedComments}
          setExpandedComments={setExpandedComments}
          collapsedReplies={collapsedReplies}
          setCollapsedReplies={setCollapsedReplies}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyText={replyText}
          setReplyText={setReplyText}
          onReplySubmit={onReplySubmit}
          submitting={submitting}
          isAuthenticated={isAuthenticated}
          user={user}
        />
      ))}

      <CommentPagination
        page={page}
        totalPages={totalPages}
        total={total}
        setPage={setPage}
      />
    </div>
  )
}
