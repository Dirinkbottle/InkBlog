import { useErrorStore } from '@/store/errorStore'

export const setupGlobalErrorHandler = () => {
  const { addError } = useErrorStore.getState()

  // 捕获全局 JavaScript 错误
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error || event.message)
    
    addError({
      title: '全局错误',
      message: event.error?.message || event.message || '发生了未知错误',
      details: event.error?.stack?.split('\n')[1]?.trim() || `${event.filename}:${event.lineno}:${event.colno}`,
    })
    
    // 阻止默认的控制台错误输出（因为我们已经在 addError 中输出了）
    event.preventDefault()
  })

  // 捕获未处理的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason)
    
    const reason = event.reason
    
    if (reason instanceof Error) {
      addError({
        title: 'Promise 错误',
        message: reason.message,
        details: reason.stack?.split('\n')[1]?.trim(),
      })
    } else if (typeof reason === 'string') {
      addError({
        title: 'Promise 错误',
        message: reason,
      })
    } else {
      addError({
        title: 'Promise 错误',
        message: JSON.stringify(reason) || '未处理的 Promise rejection',
      })
    }
    
    // 阻止默认行为
    event.preventDefault()
  })

  console.log('[Global Error Handler] Initialized')
}
