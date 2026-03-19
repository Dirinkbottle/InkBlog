import React, { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, LockKeyhole, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useErrorToast } from '@/hooks/useErrorToast'
import { useServiceSlots } from '@/hooks/useServiceSlots'
import {
  formatBytes,
  formatCPU,
  formatLatency,
  formatUptime,
  getRuntimeLabel,
  getRuntimeTone,
} from '@/components/admin/services/formatters'
import {
  getRegisteredSlots,
  renderServiceManagementPage,
} from '@/components/admin/services/registry'

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-zinc-950">{value}</div>
    </div>
  )
}

export default function ServiceManagement() {
  const { serviceId } = useParams()
  const { showError } = useErrorToast()
  const { slots, controlLock, error, loading, refreshing, fetchSlots } = useServiceSlots()

  const registeredSlots = useMemo(() => getRegisteredSlots(slots), [slots])
  const currentSlot = useMemo(
    () => registeredSlots.find((slot) => slot.id === serviceId) || null,
    [registeredSlots, serviceId]
  )

  const handleRefresh = async () => {
    try {
      await fetchSlots({ silent: true })
    } catch (error) {
      showError({
        title: '服务状态刷新失败',
        message: error.message || '无法刷新当前服务状态',
      })
    }
  }

  if (loading && !currentSlot) {
    return <div className="text-sm text-zinc-500">正在加载服务面板...</div>
  }

  if (error && !currentSlot) {
    return (
      <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-semibold text-zinc-950">服务面板加载失败</h1>
          <p className="text-sm text-zinc-500">{error.message || '无法获取服务状态，请稍后重试。'}</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
              onClick={() => void handleRefresh()}
            >
              重试
            </Button>
            <Link to="/admin">
              <Button variant="outline" className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100">
                返回仪表盘
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!currentSlot) {
    return (
      <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
        <CardContent className="space-y-4 p-8">
          <h1 className="text-2xl font-semibold text-zinc-950">服务不存在</h1>
          <p className="text-sm text-zinc-500">当前服务没有注册到管理台，或尚未暴露独立管理页面。</p>
          <Link to="/admin">
            <Button variant="outline" className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100">
              返回仪表盘
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const runtime = currentSlot.snapshot.runtime
  const controlMessage = controlLock
    ? controlLock.service_id === currentSlot.id
      ? `当前正在执行 ${controlLock.action}，其余动作已锁定。`
      : `当前 ${controlLock.service_id} 正在执行 ${controlLock.action}，全局动作锁已启用。`
    : '当前没有进行中的服务生命周期动作。'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-800">
            <ChevronLeft className="h-4 w-4" />
            返回仪表盘
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950">{currentSlot.title} 管理面板</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{currentSlot.description}</p>
        </div>

        <Button
          variant="outline"
          className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          {refreshing ? '刷新中...' : '刷新状态'}
        </Button>
      </div>

      <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getRuntimeTone(currentSlot.snapshot)}`}>
              {getRuntimeLabel(currentSlot.snapshot)}
            </div>
            <CardTitle className="mt-4 text-2xl text-zinc-950">{currentSlot.snapshot.name}</CardTitle>
            <p className="mt-2 text-sm text-zinc-500">{runtime.container_name || currentSlot.snapshot.id}</p>
          </div>

          <div className="max-w-sm rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 text-sm text-zinc-600">
            <div className="flex items-center gap-2 font-medium text-zinc-900">
              <LockKeyhole className="h-4 w-4" />
              服务动作保护
            </div>
            <p className="mt-2 leading-6">{controlMessage}</p>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryItem label="CPU" value={formatCPU(runtime.cpu_percent)} />
          <SummaryItem label="内存" value={formatBytes(runtime.memory_bytes)} />
          <SummaryItem label="运行时长" value={formatUptime(runtime.uptime_seconds)} />
          <SummaryItem label="延迟" value={formatLatency(runtime.latency_ms)} />
        </CardContent>
      </Card>

      {renderServiceManagementPage(currentSlot, { controlLock })}
    </div>
  )
}
