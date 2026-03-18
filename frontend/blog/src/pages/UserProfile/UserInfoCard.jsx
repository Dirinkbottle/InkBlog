import React from 'react'
import { Card, CardContent } from '../../components/ui/card'
import { User, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function UserInfoCard({ user }) {
  return (
    <Card className="mb-8">
      <CardContent className="pt-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {user.avatar_base64 ? (
              <img
                src={user.avatar_base64}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-2">
              {user.display_name || user.username}
            </h1>
            <div className="flex items-center text-sm text-muted-foreground mb-3">
              <User className="h-4 w-4 mr-1" />
              <span>@{user.username}</span>
            </div>
            {user.bio && (
              <p className="text-muted-foreground mb-4">{user.bio}</p>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span>加入于 {formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
