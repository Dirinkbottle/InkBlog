import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LockKeyhole, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useErrorToast } from '@/hooks/useErrorToast'
import { useServiceSlots } from '@/hooks/useServiceSlots'
import {
  getPanelSlots,
  getRegisteredSlots,
  renderServiceOverviewCard,
} from '@/components/admin/services/registry'

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const { showError } = useErrorToast()
  const { slots, controlLock, error, loading, refreshing, fetchSlots, runAction } = useServiceSlots()

  const registeredSlots = useMemo(() => getRegisteredSlots(slots), [slots])
  const panelSlots = useMemo(() => getPanelSlots(registeredSlots), [registeredSlots])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [menuOpen])

  const handleRefresh = async () => {
    try {
      await fetchSlots({ silent: true })
    } catch (error) {
      showError({
        title: '服务总览加载失败',
        message: error.message || '微服务状态获取失败',
      })
    }
  }

  const handleServiceAction = async (serviceId, action) => {
    try {
      await runAction(serviceId, action)
      await fetchSlots({ silent: true })
    } catch (error) {
      showError({
        title: error.code === 409 ? '服务操作已锁定' : '服务操作失败',
        message: error.code === 409
          ? '当前已有服务操作进行中，请等待上一项动作完成。'
          : error.message || `${action} 执行失败`,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.26em] text-zinc-400">Service Console</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">仪表盘</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
          后台首页回归纯概览视图，只展示微服务状态与生命周期控制；有管理面板的服务通过 `其它`
          单独跳转。
        </p>
      </div>

      {controlLock && (
        <div className="rounded-[24px] border border-zinc-200 bg-zinc-50/80 px-5 py-4 text-sm text-zinc-700">
          <div className="flex items-center gap-2 font-medium text-zinc-950">
            <LockKeyhole className="h-4 w-4" />
            服务动作保护已启用
          </div>
          <p className="mt-2">
            当前 {controlLock.service_id} 正在执行 {controlLock.action}，完成前所有生命周期按钮都不可重复点击。
          </p>
        </div>
      )}

      <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl text-zinc-950">微服务槽位总览</CardTitle>
            <p className="text-sm text-zinc-500">
              槽位卡片只保留状态展示和启动/停止/重启，管理面板入口统一收纳到右侧下拉。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {refreshing ? '刷新中...' : '刷新状态'}
            </Button>

            <div className="relative" ref={menuRef}>
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                onClick={() => setMenuOpen((prev) => !prev)}
                disabled={panelSlots.length === 0}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="打开服务管理面板入口菜单"
              >
                其它
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>

              {menuOpen && panelSlots.length > 0 && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 z-20 min-w-[220px] rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_14px_40px_rgba(15,23,42,0.12)]"
                >
                  {panelSlots.map((slot) => (
                    <Link
                      key={slot.id}
                      to={slot.panelRoute}
                      role="menuitem"
                      className="block rounded-xl px-4 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="font-medium">{slot.panelMenuLabel}</div>
                      <div className="mt-1 text-xs text-zinc-500">{slot.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading && registeredSlots.length === 0 ? (
            <div className="text-sm text-zinc-500">正在加载微服务状态...</div>
          ) : error && registeredSlots.length === 0 ? (
            <div className="text-sm text-zinc-500">微服务状态加载失败，请点击右上角刷新重试。</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {registeredSlots.map((slot) =>
                renderServiceOverviewCard(slot, {
                  controlLock,
                  onAction: handleServiceAction,
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
