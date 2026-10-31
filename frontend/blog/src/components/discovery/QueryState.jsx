import React from 'react'
import { BookOpen, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function QueryState({
  error,
  retry,
  title = '这里还没有文章',
  description = '换个关键词或分类，看看其他灵感。',
}) {
  return (
    <div className="query-state" role={error ? 'alert' : 'status'}>
      <span className="state-icon">
        {error ? <RefreshCw size={25} /> : <BookOpen size={25} />}
      </span>
      <h2>{error ? '内容暂时没有加载出来' : title}</h2>
      <p>{error ? '网络似乎走神了，稍后再试一次。' : description}</p>
      {error ? (
        <button className="ink-button" onClick={retry}>
          重新加载
        </button>
      ) : (
        <Link className="text-link" to="/posts">
          浏览全部文章 →
        </Link>
      )}
    </div>
  )
}
