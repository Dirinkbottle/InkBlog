import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并 className（clsx + twMerge，shadcn/ui 标准写法）
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期
 */
export function formatDate(date) {
  if (!date) return ''
  
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  
  // 小于 1 小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} 分钟前`
  }
  
  // 小于 24 小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} 小时前`
  }
  
  // 小于 7 天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days} 天前`
  }
  
  // 显示完整日期
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * 截取文本
 */
export function truncate(text, length = 100) {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

/**
 * 生成随机颜色（用于标签）
 */
export function generateColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * 深拷贝
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 防抖
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流
 */
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 生成摘要（从 Markdown 内容中）
 */
export function generateSummary(markdown, length = 150) {
  if (!markdown) return ''
  
  // 移除 Markdown 语法
  const text = markdown
    .replace(/#{1,6}\s/g, '') // 移除标题标记
    .replace(/\*\*|__/g, '') // 移除加粗
    .replace(/\*|_/g, '') // 移除斜体
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // 移除代码
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 移除图片
    .replace(/^\s*[-*+]\s/gm, '') // 移除列表标记
    .replace(/^\s*\d+\.\s/gm, '') // 移除有序列表标记
    .replace(/>\s/g, '') // 移除引用标记
    .replace(/\n+/g, ' ') // 替换换行为空格
    .trim()
  
  return truncate(text, length)
}

/**
 * 读取时间估算（基于字数）
 */
export function estimateReadingTime(content) {
  if (!content) return 0
  
  // 中文字符
  const chineseCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length
  // 英文单词
  const englishWords = content.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(w => w.length > 0).length
  
  // 中文 300字/分钟，英文 200词/分钟
  const minutes = Math.ceil(chineseCount / 300 + englishWords / 200)
  
  return Math.max(1, minutes)
}

