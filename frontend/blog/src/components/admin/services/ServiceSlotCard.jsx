import React from 'react'
import { Activity, Clock3, MemoryStick, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  formatBytes,
  formatCPU,
  formatLatency,
  formatUptime,
  getRuntimeLabel,
  getRuntimeTone,
} from './formatters'

export default function ServiceSlotCard({
  snapshot,
  icon: Icon,
  description,
  controlLock,
  onAction,
}) {
  const activeAction = controlLock?.service_id === snapshot.id ? controlLock.action : ''
  const actionLocked = Boolean(controlLock)

  return (
    <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_16px_42px_rgba(15,23,42,0.08)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2.5">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-zinc-950">{snapshot.name}</div>
                <div className="text-xs text-zinc-500">{description}</div>
              </div>
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getRuntimeTone(snapshot)}`}>
            {getRuntimeLabel(snapshot)}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <Activity className="h-4 w-4" />
              CPU
            </div>
            <div className="mt-2 text-lg font-semibold text-zinc-950">{formatCPU(snapshot.runtime.cpu_percent)}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <MemoryStick className="h-4 w-4" />
              内存
            </div>
            <div className="mt-2 text-lg font-semibold text-zinc-950">{formatBytes(snapshot.runtime.memory_bytes)}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <Clock3 className="h-4 w-4" />
              运行时长
            </div>
            <div className="mt-2 text-sm font-semibold text-zinc-950">{formatUptime(snapshot.runtime.uptime_seconds)}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3">
            <div className="flex items-center gap-2 text-zinc-500">
              <Zap className="h-4 w-4" />
              延迟
            </div>
            <div className="mt-2 text-sm font-semibold text-zinc-950">{formatLatency(snapshot.runtime.latency_ms)}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
            disabled={!snapshot.actions.start || actionLocked}
            onClick={() => onAction(snapshot.id, 'start')}
            aria-label={`启动服务 ${snapshot.name}`}
          >
            {activeAction === 'start' ? '启动中...' : '启动'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
            disabled={!snapshot.actions.stop || actionLocked}
            onClick={() => onAction(snapshot.id, 'stop')}
            aria-label={`停止服务 ${snapshot.name}`}
          >
            {activeAction === 'stop' ? '停止中...' : '停止'}
          </Button>
          <Button
            size="sm"
            className="bg-zinc-950 text-white hover:bg-zinc-800"
            disabled={!snapshot.actions.restart || actionLocked}
            onClick={() => onAction(snapshot.id, 'restart')}
            aria-label={`重启服务 ${snapshot.name}`}
          >
            {activeAction === 'restart' ? '重启中...' : '重启'}
          </Button>
        </div>

        {controlLock && (
          <div className="mt-4 text-xs text-zinc-500" aria-live="polite">
            {activeAction
              ? `当前正在执行 ${activeAction}，其它按钮已锁定。`
              : `当前 ${controlLock.service_id} 正在执行 ${controlLock.action}，全局动作锁生效中。`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
