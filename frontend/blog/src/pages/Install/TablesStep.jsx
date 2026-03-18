import React from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

export default function TablesStep({ tables, onBack, onNext }) {
  return (
    <div className="space-y-4 animate-in">
      <h3 className="text-xl font-bold mb-4">数据库表结构</h3>
      <p className="text-sm text-muted-foreground mb-4">
        将创建以下数据库表：
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {tables.map((table) => (
          <div key={table.name} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold">{table.name}</h4>
              <span className="text-sm text-muted-foreground">- {table.description}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{table.purpose}</p>
            <div className="text-xs text-muted-foreground">
              {table.fields.slice(0, 3).map((field, idx) => (
                <div key={idx}>• {field}</div>
              ))}
              {table.fields.length > 3 && (
                <div>• ... 等 {table.fields.length} 个字段</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          上一步
        </Button>
        <Button onClick={onNext} className="flex-1">
          下一步
        </Button>
      </div>
    </div>
  )
}
