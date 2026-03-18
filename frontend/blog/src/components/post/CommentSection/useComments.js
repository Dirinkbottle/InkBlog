import { useState, useEffect } from 'react'
import { commentAPI } from '@/services/api'
import { toast } from 'sonner'
import { getApiErrorMessage, shouldShowLocalApiError } from '@/utils/apiErrors'

const PAGE_SIZE = 10

export default function useComments(postId, page) {
  const [commentText, setCommentText] = useState('')
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedComments, setExpandedComments] = useState({})
  const [collapsedReplies, setCollapsedReplies] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true)
      try {
        const res = await commentAPI.getPostComments(postId, { 
          page, 
          page_size: PAGE_SIZE 
        })
        setComments(res.data?.comments || [])
        setTotal(res.data?.total || 0)
        setTotalPages(res.data?.total_pages || 0)
      } catch (error) {
        // 静默处理
      } finally {
        setLoading(false)
      }
    }
    
    if (postId) {
      fetchComments()
    }
  }, [postId, page])

  const refreshComments = async (targetPage = page) => {
    const res = await commentAPI.getPostComments(postId, { 
      page: targetPage, 
      page_size: PAGE_SIZE 
    })
    setComments(res.data?.comments || [])
    setTotal(res.data?.total || 0)
    setTotalPages(res.data?.total_pages || 0)
  }

  const handleSubmitComment = async (text) => {
    if (!text.trim()) {
      toast.error('请输入评论内容')
      return
    }

    setSubmitting(true)
    try {
      const response = await commentAPI.createComment({
        post_id: postId,
        content: text.trim(),
      })
      
      setCommentText('')
      
      if (response.data?.comment?.status === 'approved') {
        await refreshComments(1)
      }
    } catch (error) {
      if (shouldShowLocalApiError(error)) {
        toast.error(getApiErrorMessage(error, '评论提交失败'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId) => {
    if (!replyText.trim()) {
      toast.error('请输入回复内容')
      return
    }

    setSubmitting(true)
    try {
      await commentAPI.createComment({
        post_id: postId,
        parent_id: parentId,
        content: replyText.trim(),
      })
      
      setReplyText('')
      setReplyingTo(null)
      
      await refreshComments()
    } catch (error) {
      if (shouldShowLocalApiError(error)) {
        toast.error(getApiErrorMessage(error, '回复提交失败'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return {
    commentText,
    setCommentText,
    replyText,
    setReplyText,
    submitting,
    comments,
    loading,
    expandedComments,
    setExpandedComments,
    collapsedReplies,
    setCollapsedReplies,
    replyingTo,
    setReplyingTo,
    total,
    totalPages,
    handleSubmitComment,
    handleSubmitReply,
  }
}
