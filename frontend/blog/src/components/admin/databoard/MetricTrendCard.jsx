import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import MiniTrendChart from './MiniTrendChart'

const MODE_LABELS = {
  line: '折线图',
  bar: '柱状图',
  hidden: '隐藏图',
}

export default function MetricTrendCard({
  title,
  value,
  icon: Icon,
  mode,
  onToggleMode,
  points,
  accent,
  iconBackground,
  hint,
}) {
  const chartVisible = mode !== 'hidden'

  return (
    <div className="group rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_16px_42px_rgba(15,23,42,0.08)] focus-within:shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="text-4xl font-semibold tracking-tight text-zinc-950">{value}</p>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">近 14 天日增量</p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className={cn('rounded-2xl p-3', iconBackground)}>
            <Icon className="h-6 w-6 text-zinc-900" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
            onClick={onToggleMode}
          >
            {MODE_LABELS[mode]}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          chartVisible
            ? 'mt-0 max-h-0 opacity-0 group-hover:mt-5 group-hover:max-h-56 group-hover:opacity-100 group-focus-within:mt-5 group-focus-within:max-h-56 group-focus-within:opacity-100'
            : 'mt-0 max-h-0 opacity-0'
        )}
      >
        <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
          <MiniTrendChart points={points} mode={mode} accent={accent} />
          {hint && <p className="mt-3 text-xs text-zinc-500">{hint}</p>}
        </div>
      </div>
    </div>
  )
}
