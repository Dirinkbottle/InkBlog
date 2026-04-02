export function formatCPU(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0%'
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let index = 0

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }

  const fractionDigits = value >= 10 || index === 0 ? 0 : 1
  return `${value.toFixed(fractionDigits)} ${units[index]}`
}

export function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '刚启动'
  }

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}天 ${hours}小时`
  if (hours > 0) return `${hours}小时 ${minutes}分钟`
  if (minutes > 0) return `${minutes}分钟`
  return `${seconds}秒`
}

export function formatLatency(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return '--'
  }
  return `${value} ms`
}

export function formatDateTime(value) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function getRuntimeTone(snapshot) {
  const status = snapshot?.runtime?.status
  const health = snapshot?.runtime?.health

  if (status === 'running' && health === 'healthy') {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
  if (status === 'running' && (health === 'starting' || health === 'unknown')) {
    return 'bg-amber-100 text-amber-700 border-amber-200'
  }
  if (status === 'restarting' || health === 'unhealthy') {
    return 'bg-orange-100 text-orange-700 border-orange-200'
  }
  if (status === 'exited' || status === 'dead' || health === 'stopped') {
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }
  return 'bg-rose-100 text-rose-700 border-rose-200'
}

export function getRuntimeLabel(snapshot) {
  const status = snapshot?.runtime?.status || 'unknown'
  const health = snapshot?.runtime?.health || 'unknown'

  if (status === 'running' && health === 'healthy') return '运行正常'
  if (status === 'running' && health === 'starting') return '启动中'
  if (status === 'running' && health === 'unknown') return '运行中'
  if (status === 'restarting') return '重启中'
  if (status === 'exited' || status === 'dead') return '已停止'
  if (status === 'missing') return '容器缺失'
  if (health === 'unhealthy') return '健康检查失败'
  return '状态未知'
}
