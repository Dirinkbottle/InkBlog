import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card'
import { MessageSquare } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import CommentForm from './CommentForm'
import CommentList from './CommentList'
import useComments from './useComments'

export default function CommentSection({ postId }) {
  const { isAuthenticated, user } = useAuthStore()
  const [page, setPage] = useState(1)
  
  const {
    comments,
    loading,
    total,
    totalPages,
    expandedComments,
    setExpandedComments,
    collapsedReplies,
    setCollapsedReplies,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    handleSubmitComment,
    handleSubmitReply,
    submitting,
  } = useComments(postId, page)

  return (
    <div className="mt-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            评论 ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommentForm
            isAuthenticated={isAuthenticated}
            user={user}
            onSubmit={handleSubmitComment}
            submitting={submitting}
          />

          <CommentList
            comments={comments}
            loading={loading}
            total={total}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            expandedComments={expandedComments}
            setExpandedComments={setExpandedComments}
            collapsedReplies={collapsedReplies}
            setCollapsedReplies={setCollapsedReplies}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            replyText={replyText}
            setReplyText={setReplyText}
            onReplySubmit={handleSubmitReply}
            submitting={submitting}
            isAuthenticated={isAuthenticated}
            user={user}
          />
        </CardContent>
      </Card>
    </div>
  )
}
