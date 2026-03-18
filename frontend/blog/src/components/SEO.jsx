import { useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'

export default function SEO({ title, description, keywords }) {
  const { data: settings = {} } = useSettings()

  useEffect(() => {
    // 设置页面标题
    const siteTitle = settings.site_name || 'InkBlog'
    const pageTitle = title ? `${title} - ${siteTitle}` : siteTitle
    document.title = pageTitle

    // 设置 meta 标签
    const metaDescription = description || settings.site_description || settings.seo_description || ''
    const metaKeywords = keywords || settings.site_keywords || settings.seo_keywords || ''

    // 更新或创建 meta 标签
    updateMetaTag('description', metaDescription)
    updateMetaTag('keywords', metaKeywords)
    updateMetaTag('og:title', pageTitle)
    updateMetaTag('og:description', metaDescription)
  }, [title, description, keywords, settings])

  return null
}

function updateMetaTag(name, content) {
  if (!content) return

  // 先尝试 name 属性
  let meta = document.querySelector(`meta[name="${name}"]`)
  
  // 如果没找到，尝试 property 属性（用于 Open Graph）
  if (!meta && name.startsWith('og:')) {
    meta = document.querySelector(`meta[property="${name}"]`)
  }

  if (meta) {
    meta.setAttribute('content', content)
  } else {
    meta = document.createElement('meta')
    if (name.startsWith('og:')) {
      meta.setAttribute('property', name)
    } else {
      meta.setAttribute('name', name)
    }
    meta.setAttribute('content', content)
    document.head.appendChild(meta)
  }
}

