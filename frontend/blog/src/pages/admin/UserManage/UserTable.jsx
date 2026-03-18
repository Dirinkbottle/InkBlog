import React from 'react'
import { Edit, Trash2, Loader2, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRoleBadge, getStatusBadge } from './utils'

export default function UserTable({ users, loading, onEdit, onBan, onUnban, onDelete }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">用户名</th>
            <th className="px-4 py-3 text-left text-sm font-medium">邮箱</th>
            <th className="px-4 py-3 text-left text-sm font-medium">角色</th>
            <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
            <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                暂无用户
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{user.username}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(user.status)}`}>
                    {user.status === 'active' ? '正常' : '封禁'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {user.status === 'active' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBan(user.id)}
                    >
                      <UserX className="h-4 w-4 text-orange-600" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUnban(user.id)}
                    >
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
