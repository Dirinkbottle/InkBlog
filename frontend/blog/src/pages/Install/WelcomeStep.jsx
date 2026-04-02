import React from 'react'
import { Button } from '@/components/ui/button'
import { Database, User, Settings } from 'lucide-react'

export default function WelcomeStep({ onNext }) {
  return (
    <div className="space-y-4 animate-in">
      <div className="text-center py-8">
        <h2 className="mb-4 text-2xl font-bold text-zinc-950">欢迎使用 InkBlog</h2>
        <p className="mb-6 text-zinc-500">
          这个向导将帮助您完成博客系统的初始化配置
        </p>
        <p className="mb-6 text-sm text-zinc-400">预计耗时 2-3 分钟，配置完成后会自动初始化系统数据表。</p>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <Database className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
            <p className="font-semibold text-zinc-900">配置数据库</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <Settings className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
            <p className="font-semibold text-zinc-900">创建表结构</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <User className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
            <p className="font-semibold text-zinc-900">创建管理员</p>
          </div>
        </div>
      </div>
      <Button onClick={onNext} className="w-full bg-zinc-950 text-white hover:bg-zinc-800" aria-label="开始 InkBlog 安装流程">
        开始安装
      </Button>
    </div>
  )
}
