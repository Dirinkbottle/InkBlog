import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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

    // TODO: 实现修改密码API
    toast.info('修改密码功能开发中...')
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">修改密码</h3>
        <p className="text-sm text-muted-foreground mt-1">
          定期更换密码有助于保护账号安全
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">当前密码</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="请输入当前密码"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">新密码</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密码（至少6个字符）"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认新密码</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入新密码"
          />
        </div>

        <Button type="submit">修改密码</Button>
      </form>
    </div>
  )
}