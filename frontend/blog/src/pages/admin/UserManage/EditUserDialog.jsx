import React, { useEffect } from 'react'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function EditUserDialog({ user, formData, setFormData, onSubmit, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleRoleChange = (newRole) => {
    if (newRole === 'admin') {
      setFormData({
        ...formData,
        role: newRole,
        can_create_post: true,
        can_edit_post: true,
        can_delete_post: true,
        can_comment: true,
        can_view_private: true,
        can_comment_without_approval: true,
      })
    } else if (newRole === 'editor') {
      setFormData({
        ...formData,
        role: newRole,
        can_create_post: true,
        can_edit_post: true,
        can_delete_post: false,
        can_comment: true,
        can_view_private: true,
        can_comment_without_approval: true,
      })
    } else {
      setFormData({
        ...formData,
        role: newRole,
        can_create_post: false,
        can_edit_post: false,
        can_delete_post: false,
        can_comment: true,
        can_view_private: false,
        can_comment_without_approval: false,
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          编辑用户: {user.username}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="role">角色</Label>
            <select
              id="role"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <option value="user">用户</option>
              <option value="editor">编辑</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div>
            <Label htmlFor="status">状态</Label>
            <select
              id="status"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">正常</option>
              <option value="banned">封禁</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              权限设置
            </Label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.can_create_post}
                onChange={(e) => setFormData({ ...formData, can_create_post: e.target.checked })}
              />
              <span className="text-sm">可以创建文章</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.can_edit_post}
                onChange={(e) => setFormData({ ...formData, can_edit_post: e.target.checked })}
              />
              <span className="text-sm">可以编辑文章</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.can_delete_post}
                onChange={(e) => setFormData({ ...formData, can_delete_post: e.target.checked })}
              />
              <span className="text-sm">可以删除文章</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.can_comment}
                onChange={(e) => setFormData({ ...formData, can_comment: e.target.checked })}
              />
              <span className="text-sm">可以评论</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.can_view_private}
                onChange={(e) => setFormData({ ...formData, can_view_private: e.target.checked })}
              />
              <span className="text-sm">可以查看私密文章</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.can_comment_without_approval}
                onChange={(e) => setFormData({ ...formData, can_comment_without_approval: e.target.checked })}
              />
              <span className="text-sm">评论无需审核</span>
            </label>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1">
              更新
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
