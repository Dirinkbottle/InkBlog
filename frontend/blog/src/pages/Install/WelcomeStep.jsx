import React from 'react'
import { Button } from '@/components/ui/button'
import { Database, User, Settings } from 'lucide-react'

export default function WelcomeStep({ onNext }) {
  return (
    <div className="space-y-4 animate-in">
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-4">欢迎使用 InkBlog</h2>
        <p className="text-muted-foreground mb-6">
          这个向导将帮助您完成博客系统的初始化配置
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg">
            <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">配置数据库</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">创建表结构</p>
          </div>
          <div className="p-4 border rounded-lg">
            <User className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">创建管理员</p>
          </div>
        </div>
      </div>
      <Button onClick={onNext} className="w-full">
        开始安装
      </Button>
    </div>
  )
}
