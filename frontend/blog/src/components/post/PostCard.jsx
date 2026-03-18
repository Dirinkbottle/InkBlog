import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'
import { Badge } from '../ui/badge'
import { Calendar, Eye, User, MessageSquare } from 'lucide-react'
import { formatDate, truncate, generateColor } from '@/lib/utils'

const gradients = [
  'from-blue-500/80 to-cyan-400/80',
  'from-purple-500/80 to-pink-400/80',
  'from-emerald-500/80 to-teal-400/80',
  'from-orange-500/80 to-amber-400/80',
  'from-rose-500/80 to-red-400/80',
  'from-indigo-500/80 to-violet-400/80',
]

function getGradient(name) {
  if (!name) return gradients[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

export default function PostCard({ post }) {
  const hasCover = !!post.cover_image

  return (
    <Card className="card-hover h-full flex flex-col group border transition-colors duration-300 hover:border-primary/50">
      <Link to={`/posts/${post.id}`}>
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          {hasCover ? (
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getGradient(post.category?.name)} flex items-center justify-center`}>
              <span className="text-4xl font-bold text-white/90 select-none">
                {post.title?.charAt(0) || 'I'}
              </span>
            </div>
          )}
        </div>
      </Link>

      <CardHeader className="pb-2">
        {post.category && (
          <div className="mb-2">
            <Link to={`/posts?category=${post.category.id}`}>
              <Badge variant="secondary">{post.category.name}</Badge>
            </Link>
          </div>
        )}
        <CardTitle className="hover:text-primary transition-colors">
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </CardTitle>
        <CardDescription className="mt-2 line-clamp-2">
          {truncate(post.summary, 120)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Link key={tag.id} to={`/posts?tag=${tag.id}`}>
                <Badge className={generateColor(tag.name)} variant="outline">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="text-sm text-muted-foreground flex items-center justify-between border-t pt-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <User className="h-3.5 w-3.5 mr-1" />
            <span>{post.author?.username || '佚名'}</span>
          </div>
          <div className="flex items-center">
            <Eye className="h-3.5 w-3.5 mr-1" />
            <span>{post.views || 0}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            <span>{post.comment_count || 0}</span>
          </div>
        </div>
        <div className="flex items-center">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          <span>{formatDate(post.published_at || post.created_at)}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
