import React from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

export default function CompletionStep({ config, onNavigateToLogin }) {
  return (
    <div className="space-y-4 animate-in text-center py-8">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-2xl font-bold">安装完成！</h3>
      <p className="text-muted-foreground mb-6">
        InkBlog 已成功安装。请重启后端服务器以应用新配置。
      </p>
      
      <div className="bg-muted p-4 rounded-lg text-left text-sm space-y-2">
        <p><strong>管理员账户：</strong> {config.admin_user}</p>
        <p><strong>管理员邮箱：</strong> {config.admin_email}</p>
      </div>

      <div className="pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          请使用以下命令重启后端服务：
        </p>
        <code className="bg-muted p-3 rounded block">
          pm2 restart inkblog-backend
        </code>
      </div>

      <Button onClick={onNavigateToLogin} className="mt-6">
        前往登录
      </Button>
    </div>
  )
}
