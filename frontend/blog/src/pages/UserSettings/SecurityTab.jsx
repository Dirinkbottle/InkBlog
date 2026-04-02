import React, { useState } from 'react'
import { Eye, EyeOff, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/services/api'
import { toast } from 'sonner'
import { getApiErrorMessage, shouldShowLocalApiError } from '@/utils/apiErrors'

export default function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (!currentPassword || !newPassword) {
      toast.error('请输入当前密码和新密码')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致')
      return
    }
    if (newPassword.length < 6) {
      toast.error('新密码至少需要6个字符')
      return
    }
    if (currentPassword === newPassword) {
      toast.error('新密码不能与当前密码一致')
      return
    }

    setIsSubmitting(true)
    try {
      await api.put('/auth/change-password', {
        old_password: currentPassword,
        new_password: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      if (shouldShowLocalApiError(error)) {
        toast.error(getApiErrorMessage(error, '修改密码失败，请稍后重试'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Shield className="h-5 w-5 text-sky-600" />
          <h3 className="text-lg font-semibold">修改密码</h3>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          定期更换密码有助于保护账号安全
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">当前密码</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="请输入当前密码"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              aria-label={showCurrentPassword ? '隐藏当前密码' : '显示当前密码'}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">新密码</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码（至少6个字符）"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowNewPassword((prev) => !prev)}
              aria-label={showNewPassword ? '隐藏新密码' : '显示新密码'}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认新密码</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入新密码"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? '隐藏确认密码' : '显示确认密码'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">建议使用 8 位以上、包含字母和数字的密码。</p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '修改中...' : '修改密码'}
        </Button>
      </form>
    </div>
  )
}
