import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EmailSettingsTab({ settings, setSettings }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
        <div className="flex-1">
          <Label htmlFor="email_verification_enabled">启用邮箱验证</Label>
          <p className="text-sm text-slate-500 mt-1">
            新用户注册需要验证邮箱后才能登录
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="email_verification_enabled"
            className="sr-only peer"
            checked={settings.email_verification_enabled === 'true'}
            onChange={(e) => setSettings({ 
              ...settings, 
              email_verification_enabled: e.target.checked ? 'true' : 'false' 
            })}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
        </label>
      </div>

      <div>
        <Label htmlFor="email_verification_expiry_hours">验证链接有效期（小时）</Label>
        <Input
          id="email_verification_expiry_hours"
          type="number"
          value={settings.email_verification_expiry_hours}
          onChange={(e) => setSettings({ ...settings, email_verification_expiry_hours: e.target.value })}
          className="border-slate-300 bg-white"
          min={1}
          max={168}
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-semibold mb-4">SMTP 配置</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email_smtp_host">SMTP 服务器</Label>
            <Input
              id="email_smtp_host"
              value={settings.email_smtp_host}
              onChange={(e) => setSettings({ ...settings, email_smtp_host: e.target.value })}
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <Label htmlFor="email_smtp_port">SMTP 端口</Label>
            <Input
              id="email_smtp_port"
              type="number"
              value={settings.email_smtp_port}
              onChange={(e) => setSettings({ ...settings, email_smtp_port: e.target.value })}
              placeholder="587"
              min={1}
              max={65535}
            />
          </div>

          <div>
            <Label htmlFor="email_smtp_username">SMTP 用户名</Label>
            <Input
              id="email_smtp_username"
              value={settings.email_smtp_username}
              onChange={(e) => setSettings({ ...settings, email_smtp_username: e.target.value })}
              placeholder="your-email@gmail.com"
            />
          </div>

          <div>
            <Label htmlFor="email_smtp_password">SMTP 密码</Label>
            <Input
              id="email_smtp_password"
              type="password"
              value={settings.email_smtp_password}
              onChange={(e) => setSettings({ ...settings, email_smtp_password: e.target.value })}
              placeholder="应用专用密码"
            />
          </div>

          <div>
            <Label htmlFor="email_from_address">发件人邮箱</Label>
            <Input
              id="email_from_address"
              type="email"
              value={settings.email_from_address}
              onChange={(e) => setSettings({ ...settings, email_from_address: e.target.value })}
              placeholder="noreply@yourdomain.com"
            />
          </div>

          <div>
            <Label htmlFor="email_from_name">发件人名称</Label>
            <Input
              id="email_from_name"
              value={settings.email_from_name}
              onChange={(e) => setSettings({ ...settings, email_from_name: e.target.value })}
              placeholder="InkBlog"
            />
          </div>

          <div>
            <Label htmlFor="email_library">邮件发送库</Label>
            <select
              id="email_library"
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
              value={settings.email_library}
              onChange={(e) => setSettings({ ...settings, email_library: e.target.value })}
            >
              <option value="gomail">Gomail（推荐）</option>
              <option value="email">Jordan-Wright Email</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              默认使用 Gomail，如果遇到问题可切换到 Email 库
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>提示：</strong>安装时创建的管理员账户无需邮箱验证。建议使用 Gmail、Outlook 等支持 SMTP 的邮箱服务。使用 Gmail 时需要开启"应用专用密码"。
        </p>
      </div>
    </div>
  )
}
