import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function UserFilters({ search, setSearch, roleFilter, setRoleFilter, statusFilter, setStatusFilter }) {
  const clearFilters = () => {
    setSearch('')
    setRoleFilter('')
    setStatusFilter('')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="搜索用户..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-slate-300 bg-white"
        />
      </div>
      <select
        className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        <option value="">全部角色</option>
        <option value="admin">管理员</option>
        <option value="editor">编辑</option>
        <option value="user">用户</option>
      </select>
      <select
        className="px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-700"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">全部状态</option>
        <option value="active">正常</option>
        <option value="banned">封禁</option>
      </select>
      <Button type="button" variant="outline" className="border-slate-300 text-slate-700" onClick={clearFilters}>
        重置
      </Button>
    </div>
  )
}
