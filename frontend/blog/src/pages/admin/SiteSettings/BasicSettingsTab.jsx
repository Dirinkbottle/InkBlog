import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function BasicSettingsTab({ settings, setSettings }) {
  return (
    <div className="space-y-4 max-w-2xl">
      {[
        ['site_name', '博客名称', 'InkBlog', 60],
        ['hero_title', '首页标题', '留空使用默认标题', 80],
        ['hero_description', '首页简介', '留空使用网站描述', 300],
        ['site_purpose', '侧栏寄语', '记录技术成长，分享开发经验', 300],
        ['site_url', '博客公开地址', 'https://your-blog.example', 300],
      ].map(([key, label, placeholder, maxLength]) => (
        <div key={key}>
          <Label htmlFor={key}>{label}</Label>
          <Input
            id={key}
            value={settings[key] || ''}
            onChange={(event) =>
              setSettings({ ...settings, [key]: event.target.value })
            }
            placeholder={placeholder}
            maxLength={maxLength}
            type={key === 'site_url' ? 'url' : 'text'}
            className="border-input bg-background"
          />
          {key === 'site_url' && (
            <p className="text-xs text-muted-foreground mt-1">
              用于 RSS 中的文章链接。填写完整的 http(s)
              地址；留空时使用访问地址。
            </p>
          )}
        </div>
      ))}
      <div>
        <Label htmlFor="site_description">网站描述</Label>
        <textarea
          id="site_description"
          className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
          rows="3"
          value={settings.site_description}
          onChange={(e) =>
            setSettings({ ...settings, site_description: e.target.value })
          }
          placeholder="网站的详细描述..."
          maxLength={300}
        />
        <p className="text-xs text-slate-500 mt-1">
          建议 30-120 字，最多 300 字。
        </p>
      </div>
      <div>
        <Label htmlFor="footer_text">页脚文字</Label>
        <Input
          id="footer_text"
          value={settings.footer_text}
          onChange={(e) =>
            setSettings({ ...settings, footer_text: e.target.value })
          }
          placeholder="© 2025 InkBlog. All rights reserved."
          maxLength={120}
          className="border-slate-300 bg-white"
        />
      </div>
      <div>
        <Label htmlFor="icp_number">ICP 备案号</Label>
        <Input
          id="icp_number"
          value={settings.icp_number}
          onChange={(e) =>
            setSettings({ ...settings, icp_number: e.target.value })
          }
          placeholder="蜀ICP备XXXXXXXXX号"
          maxLength={40}
          className="border-slate-300 bg-white"
        />
        <p className="text-xs text-slate-500 mt-1">留空则不显示备案信息</p>
      </div>
    </div>
  )
}
