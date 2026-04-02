import React from 'react'
import { Card, CardContent } from './ui/card'

export default function StatCard({ icon, label, value, color = 'blue' }) {
  const iconColors = {
    blue: 'text-sky-700 bg-sky-100',
    green: 'text-emerald-700 bg-emerald-100',
    purple: 'text-indigo-700 bg-indigo-100',
    orange: 'text-amber-700 bg-amber-100',
    pink: 'text-rose-700 bg-rose-100',
    slate: 'text-slate-700 bg-slate-100',
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${iconColors[color]}`}>
            {icon}
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
