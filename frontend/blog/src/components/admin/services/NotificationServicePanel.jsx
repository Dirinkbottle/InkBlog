import React, { useEffect, useState } from 'react'
import { RefreshCcw, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { serviceAdminAPI } from '@/services/api'
import { formatDateTime } from './formatters'

const INITIAL_FILTERS = {
  status: '',
  targetType: '',
  userId: '',
  sessionId: '',
  page: 1,
  pageSize: 10,
}

const INITIAL_SEND_FORM = {
  targetType: 'user',
  sessionId: '',
  userId: '',
  level: 'info',
  title: '',
  message: '',
  ttlSeconds: 600,
  payloadText: '{}',
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-950">{value}</div>
    </div>
  )
}

export default function NotificationServicePanel({ serviceId = 'notification', snapshot }) {
  const [summary, setSummary] = useState(null)
  const [sessions, setSessions] = useState([])
  const [deliveries, setDeliveries] = useState({ items: [], total: 0, page: 1, page_size: 10 })
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [sendForm, setSendForm] = useState(INITIAL_SEND_FORM)
  const [sendState, setSendState] = useState({ loading: false, message: '', error: '' })

  const loadPanel = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError('')

    try {
      const [summaryRes, sessionsRes, deliveriesRes] = await Promise.all([
        serviceAdminAPI.getPanel(serviceId, 'summary'),
        serviceAdminAPI.getPanel(serviceId, 'sessions'),
        serviceAdminAPI.getPanel(serviceId, 'deliveries', {
          status: filters.status || undefined,
          target_type: filters.targetType || undefined,
          user_id: filters.userId || undefined,
          session_id: filters.sessionId || undefined,
          page: filters.page,
          page_size: filters.pageSize,
        }),
      ])

      setSummary(summaryRes.data)
      setSessions(sessionsRes.data.list || [])
      setDeliveries(deliveriesRes.data || { items: [], total: 0, page: 1, page_size: filters.pageSize })
    } catch (fetchError) {
      setError(fetchError.message || '通知面板加载失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadPanel()
    const timer = window.setInterval(() => {
      void loadPanel({ silent: true })
    }, 10000)
    return () => window.clearInterval(timer)
  }, [filters.page, filters.pageSize, filters.sessionId, filters.status, filters.targetType, filters.userId])

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1,
    }))
  }

  const handleSend = async (event) => {
    event.preventDefault()
    setSendState({ loading: false, message: '', error: '' })

    if (!sendForm.message.trim()) {
      setSendState({ loading: false, message: '', error: '通知正文不能为空' })
      return
    }
    if (sendForm.targetType === 'session' && !sendForm.sessionId.trim()) {
      setSendState({ loading: false, message: '', error: 'session 目标必须填写 session id' })
      return
    }
    if (sendForm.targetType === 'user' && !sendForm.userId.trim()) {
      setSendState({ loading: false, message: '', error: 'user 目标必须填写用户 ID' })
      return
    }
    const parsedUserID = Number(sendForm.userId)
    if (
      sendForm.targetType === 'user' &&
      (!Number.isInteger(parsedUserID) || parsedUserID <= 0)
    ) {
      setSendState({ loading: false, message: '', error: '用户 ID 必须是正整数' })
      return
    }

    let payload = {}
    try {
      payload = sendForm.payloadText.trim() ? JSON.parse(sendForm.payloadText) : {}
    } catch {
      setSendState({ loading: false, message: '', error: 'payload JSON 格式错误' })
      return
    }

    setSendState({ loading: true, message: '', error: '' })
    try {
      const target = { type: sendForm.targetType }
      if (sendForm.targetType === 'session') {
        target.session_id = sendForm.sessionId.trim()
      }
      if (sendForm.targetType === 'user') {
        target.user_id = parsedUserID
      }

      const response = await serviceAdminAPI.postPanel(serviceId, 'send', {
        target,
        toast: {
          level: sendForm.level,
          title: sendForm.title.trim(),
          message: sendForm.message.trim(),
          payload,
          ttl_seconds: Number(sendForm.ttlSeconds) || 600,
        },
      })

      setSendState({
        loading: false,
        message: `通知已入队，创建 ${response.data.created} 条 delivery`,
        error: '',
      })
      setSendForm((prev) => ({
        ...prev,
        title: '',
        message: '',
        payloadText: '{}',
      }))
      void loadPanel({ silent: true })
    } catch (sendError) {
      setSendState({
        loading: false,
        message: '',
        error: sendError.message || '通知发送失败',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl text-zinc-950">{snapshot?.name || 'Notification'} 管理面板</CardTitle>
            <p className="mt-2 text-sm text-zinc-500">
              查看在线 session、delivery 历史，并从面板直接发通知。
            </p>
          </div>
          <Button
            variant="outline"
            className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
            onClick={() => void loadPanel({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {refreshing ? '刷新中...' : '刷新'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            <SummaryCard label="在线 Session" value={summary?.online_sessions ?? '--'} />
            <SummaryCard label="Pending" value={summary?.pending_count ?? '--'} />
            <SummaryCard label="Delivered" value={summary?.delivered_count ?? '--'} />
            <SummaryCard label="ACK" value={summary?.acknowledged_count ?? '--'} />
            <SummaryCard label="Expired" value={summary?.expired_count ?? '--'} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-950">Delivery 历史</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="delivery-status">状态</Label>
                <select
                  id="delivery-status"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
                  value={filters.status}
                  onChange={(event) => updateFilter('status', event.target.value)}
                >
                  <option value="">全部</option>
                  <option value="pending">pending</option>
                  <option value="delivered">delivered</option>
                  <option value="acknowledged">acknowledged</option>
                  <option value="expired">expired</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-target">目标类型</Label>
                <select
                  id="delivery-target"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
                  value={filters.targetType}
                  onChange={(event) => updateFilter('targetType', event.target.value)}
                >
                  <option value="">全部</option>
                  <option value="session">session</option>
                  <option value="user">user</option>
                  <option value="broadcast">broadcast</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-user-id">用户 ID</Label>
                <Input
                  id="delivery-user-id"
                  value={filters.userId}
                  onChange={(event) => updateFilter('userId', event.target.value)}
                  placeholder="例如 12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-session-id">Session ID</Label>
                <Input
                  id="delivery-session-id"
                  value={filters.sessionId}
                  onChange={(event) => updateFilter('sessionId', event.target.value)}
                  placeholder="tab session"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-200">
              <table className="min-w-full divide-y text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">消息</th>
                    <th className="px-4 py-3 text-left font-medium">目标</th>
                    <th className="px-4 py-3 text-left font-medium">状态</th>
                    <th className="px-4 py-3 text-left font-medium">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-zinc-500">
                        加载中...
                      </td>
                    </tr>
                  ) : deliveries.items.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-zinc-500">
                        暂无匹配的 delivery
                      </td>
                    </tr>
                  ) : (
                    deliveries.items.map((item) => (
                      <tr key={item.delivery_id}>
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium">{item.title || item.message}</div>
                          {item.title && <div className="mt-1 text-zinc-500">{item.message}</div>}
                          <div className="mt-2 text-xs text-zinc-500">
                            {item.level} · attempts {item.attempt_count} · {item.source_service}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-500">
                          <div>{item.target_type}</div>
                          <div className="mt-1 break-all text-xs">
                            {item.target_session_id || '--'}
                            {item.target_user_id ? ` · user ${item.target_user_id}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium">{item.status}</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            ACK: {formatDateTime(item.acknowledged_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-zinc-500">
                          <div>创建 {formatDateTime(item.created_at)}</div>
                          <div className="mt-1">过期 {formatDateTime(item.expires_at)}</div>
                          <div className="mt-1">投递 {formatDateTime(item.last_delivered_at)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                共 {deliveries.total || 0} 条，第 {deliveries.page || 1} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                  disabled={(deliveries.page || 1) <= 1}
                  onClick={() => updateFilter('page', Math.max(1, (deliveries.page || 1) - 1))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
                  disabled={(deliveries.page || 1) * (deliveries.page_size || filters.pageSize) >= (deliveries.total || 0)}
                  onClick={() => updateFilter('page', (deliveries.page || 1) + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <CardHeader>
              <CardTitle className="text-xl text-zinc-950">手动发送通知</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSend}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="send-target-type">目标类型</Label>
                    <select
                      id="send-target-type"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
                      value={sendForm.targetType}
                      onChange={(event) => setSendForm((prev) => ({ ...prev, targetType: event.target.value }))}
                    >
                      <option value="user">user</option>
                      <option value="session">session</option>
                      <option value="broadcast">broadcast</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="send-level">级别</Label>
                    <select
                      id="send-level"
                      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700"
                      value={sendForm.level}
                      onChange={(event) => setSendForm((prev) => ({ ...prev, level: event.target.value }))}
                    >
                      <option value="success">success</option>
                      <option value="error">error</option>
                      <option value="warning">warning</option>
                      <option value="info">info</option>
                    </select>
                  </div>
                </div>

                {sendForm.targetType === 'session' && (
                  <div className="space-y-2">
                    <Label htmlFor="send-session-id">Session ID</Label>
                    <Input
                      id="send-session-id"
                      value={sendForm.sessionId}
                      onChange={(event) => setSendForm((prev) => ({ ...prev, sessionId: event.target.value }))}
                      placeholder="目标 session"
                    />
                  </div>
                )}

                {sendForm.targetType === 'user' && (
                  <div className="space-y-2">
                    <Label htmlFor="send-user-id">用户 ID</Label>
                    <Input
                      id="send-user-id"
                      type="number"
                      min="1"
                      value={sendForm.userId}
                      onChange={(event) => setSendForm((prev) => ({ ...prev, userId: event.target.value }))}
                      placeholder="目标用户 ID（正整数）"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="send-title">标题</Label>
                  <Input
                    id="send-title"
                    value={sendForm.title}
                    onChange={(event) => setSendForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="可选标题"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="send-message">正文</Label>
                  <textarea
                    id="send-message"
                    className="min-h-[100px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                    value={sendForm.message}
                    onChange={(event) => setSendForm((prev) => ({ ...prev, message: event.target.value }))}
                    placeholder="请输入通知正文"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="send-ttl">TTL 秒数</Label>
                    <Input
                      id="send-ttl"
                      type="number"
                      min="1"
                      value={sendForm.ttlSeconds}
                      onChange={(event) => setSendForm((prev) => ({ ...prev, ttlSeconds: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="send-payload">Payload JSON</Label>
                    <textarea
                      id="send-payload"
                      className="min-h-[88px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                      value={sendForm.payloadText}
                      onChange={(event) => setSendForm((prev) => ({ ...prev, payloadText: event.target.value }))}
                    />
                  </div>
                </div>

                {sendState.error && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {sendState.error}
                  </div>
                )}
                {sendState.message && (
                  <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700">
                    {sendState.message}
                  </div>
                )}

                <Button type="submit" disabled={sendState.loading} className="bg-zinc-950 text-white hover:bg-zinc-800">
                  <Send className="mr-2 h-4 w-4" />
                  {sendState.loading ? '发送中...' : '发送通知'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-zinc-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
            <CardHeader>
              <CardTitle className="text-xl text-zinc-950">在线 Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-zinc-500">加载中...</div>
              ) : sessions.length === 0 ? (
                <div className="text-sm text-zinc-500">当前没有在线 session</div>
              ) : (
                sessions.map((session) => (
                  <div key={session.session_id} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
                    <div className="break-all font-medium">{session.session_id}</div>
                    <div className="mt-2 text-sm text-zinc-500">
                      用户: {session.user_id ?? '匿名'}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      建连时间: {formatDateTime(session.connected_at)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
