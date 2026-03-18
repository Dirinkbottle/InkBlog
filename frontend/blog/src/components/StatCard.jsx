import React from 'react'
import { Card, CardContent } from './ui/card'

export default function StatCard({ icon, label, value, color = 'blue' }) {
  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50',
    pink: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/50',
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${iconColors[color]}`}>
            {icon}
          </div>
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
