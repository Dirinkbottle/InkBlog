import React from 'react'
import { Edit, Trash2, Loader2, UserCheck, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRoleBadge, getStatusBadge } from './utils'

export default function UserTable({ users, loading, onEdit, onBan, onUnban, onDelete }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    )
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">用户名</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">邮箱</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">角色</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">状态</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">操作</th>
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
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{user.username}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{user.email}</td>
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
                    aria-label={`编辑用户 ${user.username}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {user.status === 'active' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBan(user.id)}
                      aria-label={`封禁用户 ${user.username}`}
                    >
                      <UserX className="h-4 w-4 text-orange-600" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUnban(user.id)}
                      aria-label={`解封用户 ${user.username}`}
                    >
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(user.id)}
                    aria-label={`删除用户 ${user.username}`}
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
