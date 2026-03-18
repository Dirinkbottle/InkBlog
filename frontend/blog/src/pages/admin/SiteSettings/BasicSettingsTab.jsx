import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function BasicSettingsTab({ settings, setSettings }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <Label htmlFor="site_description">网站描述</Label>
        <textarea
          id="site_description"
          className="w-full px-3 py-2 border rounded-md"
          rows="3"
          value={settings.site_description}
          onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
          placeholder="网站的详细描述..."
        />
      </div>
      <div>
        <Label htmlFor="footer_text">页脚文字</Label>
        <Input
          id="footer_text"
          value={settings.footer_text}
          onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
          placeholder="© 2025 InkBlog. All rights reserved."
        />
      </div>
      <div>
        <Label htmlFor="icp_number">ICP 备案号</Label>
        <Input
          id="icp_number"
          value={settings.icp_number}
          onChange={(e) => setSettings({ ...settings, icp_number: e.target.value })}
          placeholder="蜀ICP备XXXXXXXXX号"
        />
        <p className="text-xs text-muted-foreground mt-1">留空则不显示备案信息</p>
      </div>
    </div>
  )
}
