import React, { useState, useEffect } from 'react'
import { Mail, Check, X, Upload } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useAuthStore from '@/store/authStore'
import api from '@/services/api'
import { toast } from 'sonner'
import { getApiErrorMessage, shouldShowLocalApiError } from '@/utils/apiErrors'

export default function ProfileTab() {
  const { user, updateUser } = useAuthStore()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatarBase64, setAvatarBase64] = useState(user?.avatar_base64 || '')
  const [updating, setUpdating] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // 监听user变化，同步到组件state
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '')
      setBio(user.bio || '')
      setAvatarBase64(user.avatar_base64 || '')
    }
  }, [user])

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarBase64(e.target?.result || '')
    }
    reader.readAsDataURL(file)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const response = await api.put('/auth/profile', {
        display_name: displayName,
        bio,
        avatar_base64: avatarBase64,
      })
      updateUser(response.data)
    } catch (error) {
      if (shouldShowLocalApiError(error)) {
        toast.error(getApiErrorMessage(error, '更新失败，请稍后重试'))
      }
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    if (newPassword.length < 6) {
      toast.error('密码长度不能少于6位')
      return
    }

    setChangingPassword(true)
    try {
      await api.put('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      if (shouldShowLocalApiError(error)) {
        toast.error(getApiErrorMessage(error, '修改失败，请稍后重试'))
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const permissions = [
    { label: '创建文章', value: user?.permissions?.can_create_post },
    { label: '编辑文章', value: user?.permissions?.can_edit_post },
    { label: '删除文章', value: user?.permissions?.can_delete_post },
    { label: '发表评论', value: user?.permissions?.can_comment },
    { label: '查看私密文章', value: user?.permissions?.can_view_private },
  ]

  return (
    <div className="space-y-6">
      {/* 头像预览 */}
      <div className="flex items-center gap-5 pb-6 border-b">
        {avatarBase64 ? (
          <img
            src={avatarBase64}
            alt={displayName || user?.username}
            className="w-20 h-20 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-border">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-lg">{user?.display_name || user?.username}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {user?.role === 'admin' ? '管理员' : user?.role === 'editor' ? '编辑' : '普通用户'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              user?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {user?.status === 'active' ? '正常' : '封禁'}
            </span>
          </div>
        </div>
      </div>

      {/* 个人信息表单 */}
      <form onSubmit={handleUpdateProfile} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input id="username" value={user?.username || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">用户名不可修改</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={user?.email || ''} disabled className="pl-10 bg-muted" />
            </div>
            <p className="text-xs text-muted-foreground">邮箱不可修改</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">显示名称</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="请输入显示名称（可选）"
          />
          <p className="text-xs text-muted-foreground">用于公开展示的名称</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">个人简介</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="介绍一下你自己吧..."
            className="w-full min-h-[100px] px-3 py-2 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatar">头像</Label>
          <div className="flex gap-2">
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="cursor-pointer"
            />
            <Button type="button" variant="outline" onClick={() => document.getElementById('avatar')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              上传
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">支持 JPG、PNG 等格式，大小不超过 2MB</p>
        </div>

        <Button type="submit" disabled={updating}>
          {updating ? '保存中...' : '保存更改'}
        </Button>
      </form>

      {/* 修改密码表单 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">旧密码</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入旧密码"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（最少6位）"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? '修改中...' : '修改密码'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 权限信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">权限信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {permissions.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                {value ? (
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <X className="h-4 w-4 text-red-400 shrink-0" />
                )}
                <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
