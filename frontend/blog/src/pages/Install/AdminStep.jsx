import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'

export default function AdminStep({ config, onChange, onBack, onInstall, loading, error }) {
  return (
    <div className="space-y-4 animate-in">
      <h3 className="text-xl font-bold mb-4">创建管理员账户</h3>

      <div>
        <Label>用户名</Label>
        <Input
          value={config.admin_user}
          onChange={(e) => onChange('admin_user', e.target.value)}
          placeholder="admin"
        />
      </div>

      <div>
        <Label>邮箱</Label>
        <Input
          type="email"
          value={config.admin_email}
          onChange={(e) => onChange('admin_email', e.target.value)}
          placeholder="admin@example.com"
        />
      </div>

      <div>
        <Label>密码（至少6位）</Label>
        <Input
          type="password"
          value={config.admin_pass}
          onChange={(e) => onChange('admin_pass', e.target.value)}
          placeholder="请输入密码"
        />
      </div>


      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          上一步
        </Button>
        <Button onClick={onInstall} disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          开始安装
        </Button>
      </div>
    </div>
  )
}
