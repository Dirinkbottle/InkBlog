import React, { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Bookmark, History, Search, ArrowUpRight, Trash2 } from 'lucide-react'
import useReadingStore from '../store/readingStore'
import PostList from '../components/post/PostList'
import SEO from '../components/SEO'
import QueryState from '../components/discovery/QueryState'

export default function Library() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'history' ? 'history' : 'bookmarks'
  const [search, setSearch] = useState('')
  const { bookmarks, history, storageError, clearHistory } = useReadingStore()
  const [confirmClear, setConfirmClear] = useState(false)
  const items = (tab === 'history' ? history : bookmarks).filter((post) =>
    `${post.title} ${post.summary}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  return (
    <>
      <SEO title="阅读书房" />
      <div className="site-width page-space">
        <header className="page-intro">
          <span className="eyebrow">YOUR QUIET READING CORNER</span>
          <h1>好文字，留给有空的自己。</h1>
          <p>收藏想读的文章，接着上次的思绪继续。</p>
        </header>
        <div className="library-notice">
          {storageError
            ? '浏览器存储不可用，当前记录无法持久保存。'
            : '这间书房属于当前浏览器，无需登录。收藏与阅读记录不会同步到其他设备；最多保留 200 篇收藏和 50 条足迹。'}
        </div>
        <div className="library-toolbar">
          <div className="category-tabs">
            <button
              className={tab === 'bookmarks' ? 'selected' : ''}
              onClick={() => {
                setParams({})
                setConfirmClear(false)
              }}
            >
              <Bookmark size={16} />
              稍后读<span>{bookmarks.length}</span>
            </button>
            <button
              className={tab === 'history' ? 'selected' : ''}
              onClick={() => setParams({ tab: 'history' })}
            >
              <History size={16} />
              阅读足迹<span>{history.length}</span>
            </button>
          </div>
          <label className="library-search">
            <Search size={17} />
            <input
              aria-label="搜索阅读书房"
              placeholder="在书房里找一找"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        {tab === 'history' && history.length > 0 && (
          <div className="history-actions">
            {confirmClear ? (
              <>
                <span>清除本机所有阅读足迹？</span>
                <button
                  onClick={() => {
                    clearHistory()
                    setConfirmClear(false)
                  }}
                >
                  确认清除
                </button>
                <button onClick={() => setConfirmClear(false)}>取消</button>
              </>
            ) : (
              <button onClick={() => setConfirmClear(true)}>
                <Trash2 size={14} />
                清除阅读足迹
              </button>
            )}
          </div>
        )}
        {!items.length ? (
          <QueryState
            title={
              search
                ? '没有找到这篇文章'
                : tab === 'history'
                  ? '从一篇好文章开始吧'
                  : '留一点好奇，给下一次阅读'
            }
            description={
              search
                ? '换一个关键词试试看。'
                : '点击文章上的书签，就能把喜欢的文字留在这里。'
            }
          />
        ) : tab === 'bookmarks' ? (
          <PostList posts={items} />
        ) : (
          <div className="history-list">
            {items.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="history-entry"
              >
                <span className="history-symbol">
                  <History size={21} />
                </span>
                <div>
                  <h2>{post.title}</h2>
                  <span>
                    {post.readAt &&
                      new Date(post.readAt).toLocaleDateString('zh-CN')}{' '}
                    · 已读 {Math.round(post.progress)}%
                  </span>
                  <div className="history-progress">
                    <span style={{ width: `${post.progress}%` }} />
                  </div>
                </div>
                <span className="continue-label">继续阅读</span>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
