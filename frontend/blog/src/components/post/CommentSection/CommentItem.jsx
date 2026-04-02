import React from 'react'
import { Button } from '../../ui/button'
import { Reply, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCommentDate } from './utils'

export default function CommentItem({
  comment,
  isReply = false,
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
  const isLong = comment.content.length > 300
  const isExpanded = expandedComments[comment.id]
  const hasReplies = comment.replies && comment.replies.length > 0
  const repliesCollapsed = collapsedReplies[comment.id]
  const replyMax = 1000

  return (
    <div className={`${isReply ? 'ml-12' : ''} border-b pb-4 last:border-b-0`}>
      <div className="flex items-start space-x-3">
        {comment.user?.avatar_base64 ? (
          <img
            src={comment.user.avatar_base64}
            alt={comment.user.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {comment.user?.username?.charAt(0).toUpperCase() || '游'}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm">
              {comment.user?.username || '游客'}
            </span>
            <span className="text-xs text-slate-500" title={comment.created_at}>
              {formatCommentDate(comment.created_at)}
            </span>
            {comment.status === 'pending' && (
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded">
                待审核
              </span>
            )}
          </div>
          
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {isLong && !isExpanded 
              ? comment.content.slice(0, 300) + '...' 
              : comment.content}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            {isLong && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-primary"
                onClick={() => setExpandedComments({
                  ...expandedComments, 
                  [comment.id]: !isExpanded
                })}
              >
                {isExpanded ? '收起' : '展开'}
              </Button>
            )}
            
            {isAuthenticated && user?.permissions?.can_comment && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  setReplyText('')
                }}
              >
                <Reply className="h-3 w-3 mr-1" />
                回复
              </Button>
            )}
            
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setCollapsedReplies({
                  ...collapsedReplies,
                  [comment.id]: !repliesCollapsed
                })}
              >
                {repliesCollapsed ? (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    展开 {comment.replies.length} 条回复
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    收起回复
                  </>
                )}
              </Button>
            )}
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3 bg-muted/30 rounded-lg p-3">
              <textarea
                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                rows="3"
                placeholder={`回复 @${comment.user?.username || '游客'}...`}
                value={replyText}
                maxLength={replyMax}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <div className="flex items-center justify-between gap-2 mt-2">
                <span className="text-xs text-slate-400">{replyText.trim().length}/{replyMax}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null)
                    setReplyText('')
                  }}
                >
                  取消
                </Button>
                <Button 
                  size="sm"
                  onClick={() => onReplySubmit(comment.id)}
                  disabled={submitting || !replyText.trim()}
                >
                  {submitting ? '发送中...' : '发送'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {hasReplies && !repliesCollapsed && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
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
        </div>
      )}
    </div>
  )
}
