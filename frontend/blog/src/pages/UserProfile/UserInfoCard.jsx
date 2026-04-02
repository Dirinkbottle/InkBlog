import React from 'react'
import { Card, CardContent } from '../../components/ui/card'
import { User, Calendar, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function UserInfoCard({ user }) {
  return (
    <Card className="mb-8 border-slate-200 bg-white shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {user.avatar_base64 ? (
              <img
                src={user.avatar_base64}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-slate-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-slate-700 flex items-center justify-center text-white text-4xl font-bold ring-2 ring-slate-100">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2 text-slate-900">
              {user.display_name || user.username}
            </h1>
            <div className="flex items-center text-sm text-slate-500 mb-3">
              <User className="h-4 w-4 mr-1" />
              <span>@{user.username}</span>
            </div>
            {user.bio && (
              <p className="text-slate-600 mb-4">{user.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                加入于 {formatDate(user.created_at)}
              </span>
              <span className="inline-flex items-center">
                <FileText className="mr-1 h-4 w-4" />
                已发布 {user.published_post_count ?? 0} 篇
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
