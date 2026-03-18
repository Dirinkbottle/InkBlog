import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../ui/button'
import { Edit } from 'lucide-react'
import useThemeStore from '@/store/themeStore'
import useAuthStore from '@/store/authStore'
import PostHeader from './PostHeader'
import PostContent from './PostContent'

export default function PostDetail({ post }) {
  const { theme } = useThemeStore()
  const { user, isAuthenticated } = useAuthStore()
  
  const canEdit = isAuthenticated && (
    user?.role === 'admin' || 
    (user?.permissions?.can_edit_post && user?.id === post.author_id) ||
    user?.id === post.author_id
  )

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight flex-1">{post.title}</h1>
          {canEdit && (
            <Link to={`/admin/posts/${post.id}/edit`}>
              <Button variant="outline" size="sm" className="ml-4">
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
            </Link>
          )}
        </div>

        <PostHeader post={post} />
      </header>

      {post.cover_image && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img src={post.cover_image} alt={post.title} className="w-full h-auto" />
        </div>
      )}

      <PostContent content={post.content} theme={theme} />
    </article>
  )
}
