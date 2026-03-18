import { useSuccessStore } from '@/store/successStore'
import { useErrorStore } from '@/store/errorStore'

export const setupAlertHook = () => {
  const originalAlert = window.alert

  window.alert = function(message) {
    console.log('[Alert Intercepted]', message)
    
    // 处理对象类型的错误（后端返回的格式）
    let messageStr = ''
    if (typeof message === 'object' && message !== null) {
      messageStr = message.message || message.error || String(message)
    } else {
      messageStr = String(message || '')
    }
    
    // 判断是成功还是错误提示
    const successKeywords = ['成功', '已', '完成', '保存', '创建', '更新', '删除', '发布', '连接成功']
    const errorKeywords = ['失败', '错误', '请', '不能', '无法', '禁止', '超过', '不支持', '没有权限', '权限不足', '拒绝', '封禁']
    
    const isSuccess = successKeywords.some(keyword => messageStr.includes(keyword))
    const isError = errorKeywords.some(keyword => messageStr.includes(keyword))
    
    if (isSuccess && !isError) {
      // 成功提示
      const { addSuccess } = useSuccessStore.getState()
      addSuccess(messageStr)
    } else if (isError) {
      // 错误提示
      const { addError } = useErrorStore.getState()
      addError({ message: messageStr })
    } else {
      // 无法判断，默认显示为成功提示
      const { addSuccess } = useSuccessStore.getState()
      addSuccess(messageStr)
    }
    
    // 不调用原生 alert，完全阻止
    // originalAlert.call(window, message)
  }
  
  console.log('[Alert Hook] Installed - All alert() calls will be converted to toast notifications')
}

export const restoreAlert = () => {
  // 如果需要恢复原生 alert，可以保存引用后恢复
  // 这里暂不实现，因为通常不需要
}
