import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'

export default function DatabaseStep({ config, onChange, onBack, onTest, loading, error }) {
  return (
    <div className="space-y-4 animate-in">
      <h3 className="text-xl font-bold mb-4">数据库配置</h3>
      
      <div>
        <Label>数据库类型</Label>
        <select
          value={config.db_type}
          onChange={(e) => onChange('db_type', e.target.value)}
          className="w-full h-10 px-3 py-2 border rounded-md mt-1"
        >
          <option value="mysql">MySQL</option>
          <option value="postgres">PostgreSQL</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>主机地址</Label>
          <Input
            value={config.db_host}
            onChange={(e) => onChange('db_host', e.target.value)}
          />
        </div>
        <div>
          <Label>端口</Label>
          <Input
            value={config.db_port}
            onChange={(e) => onChange('db_port', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>数据库名</Label>
        <Input
          value={config.db_name}
          onChange={(e) => onChange('db_name', e.target.value)}
          placeholder="inkblog"
        />
      </div>

      <div>
        <Label>用户名</Label>
        <Input
          value={config.db_user}
          onChange={(e) => onChange('db_user', e.target.value)}
        />
      </div>

      <div>
        <Label>密码</Label>
        <Input
          type="password"
          value={config.db_pass}
          onChange={(e) => onChange('db_pass', e.target.value)}
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
        <Button onClick={onTest} disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          测试连接
        </Button>
      </div>
    </div>
  )
}
