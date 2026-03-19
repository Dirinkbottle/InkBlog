import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatBytes,
  formatCPU,
  formatDateTime,
  formatLatency,
  formatUptime,
  getRuntimeLabel,
  getRuntimeTone,
} from './formatters'

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-2 break-all text-sm font-medium text-zinc-950">{value || '--'}</div>
    </div>
  )
}

export default function DefaultServicePanel({ snapshot, description }) {
  return (
    <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-2xl text-zinc-950">{snapshot.name}</CardTitle>
          <p className="mt-2 text-sm text-zinc-500">{description}</p>
        </div>
        <Badge className={getRuntimeTone(snapshot)}>{getRuntimeLabel(snapshot)}</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="CPU" value={formatCPU(snapshot.runtime.cpu_percent)} />
          <DetailItem label="内存" value={formatBytes(snapshot.runtime.memory_bytes)} />
          <DetailItem label="运行时长" value={formatUptime(snapshot.runtime.uptime_seconds)} />
          <DetailItem label="延迟" value={formatLatency(snapshot.runtime.latency_ms)} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailItem label="容器名" value={snapshot.runtime.container_name} />
          <DetailItem label="镜像" value={snapshot.runtime.image} />
          <DetailItem label="运行状态" value={snapshot.runtime.status} />
          <DetailItem label="健康状态" value={snapshot.runtime.health} />
          <DetailItem label="启动时间" value={formatDateTime(snapshot.runtime.started_at)} />
          <DetailItem label="面板类型" value={snapshot.panel_key || 'default'} />
        </div>
      </CardContent>
    </Card>
  )
}
