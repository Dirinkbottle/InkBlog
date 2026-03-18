import React from 'react'
import { Label } from '@/components/ui/label'

export default function CommentSettingsTab({ settings, setSettings }) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex-1">
          <Label htmlFor="comment_auto_approve">评论自动审核</Label>
          <p className="text-sm text-muted-foreground mt-1">
            开启后新评论将自动通过审核并显示
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="comment_auto_approve"
            className="sr-only peer"
            checked={settings.comment_auto_approve === 'true'}
            onChange={(e) => setSettings({ 
              ...settings, 
              comment_auto_approve: e.target.checked ? 'true' : 'false' 
            })}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>提示：</strong>即使关闭自动审核，管理员和拥有"评论无需审核"权限的用户的评论仍会自动通过。您可以在用户管理中为特定用户设置此权限。
        </p>
      </div>
    </div>
  )
}
