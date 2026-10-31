import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, LayoutGrid, List, X, SlidersHorizontal } from 'lucide-react'
import { usePosts } from '../../hooks/usePosts'
import { useCategories, useTags } from '../../hooks/useCategories'
import { normalizePage } from '../../lib/reading'
import PostList from '../post/PostList'
import SEO from '../SEO'
import BlogSidebar from './BlogSidebar'
import Pagination from './Pagination'
import QueryState from './QueryState'

function SearchField({ value, onSearch }) {
  const [input, setInput] = useState(value)
  return (
    <form
      className="discovery-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(input.trim())
      }}
    >
      <Search size={21} />
      <input
        aria-label="搜索文章关键词"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="搜一段文字，找一点灵感…"
        maxLength={200}
      />
      {input && (
        <button
          type="button"
          className="icon-button"
          aria-label="清空搜索"
          onClick={() => {
            setInput('')
            onSearch('')
          }}
        >
          <X size={17} />
        </button>
      )}
      <button className="ink-button" type="submit">
        搜索
      </button>
    </form>
  )
}

export default function Discover({ searchMode = false }) {
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState('grid')
  const page = normalizePage(params.get('page'))
  const q = (params.get('q') || '').slice(0, 200)
  const category = params.get('category') || ''
  const tag = params.get('tag') || ''
  const sort = ['newest', 'oldest', 'popular'].includes(params.get('sort'))
    ? params.get('sort')
    : 'newest'
  const { data, isLoading, error, refetch } = usePosts({
    page,
    page_size: 12,
    search: q,
    category_id: category,
    tag_id: tag,
    sort,
    status: 'published',
  })
  const { data: categories } = useCategories()
  const { data: tags } = useTags()
  const result = data?.data
  const update = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, String(value))
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  const changePage = (next) => {
    update('page', next)
    document
      .getElementById('discovery-results')
      ?.scrollIntoView({ behavior: 'smooth' })
  }
  const activeCategory = categories?.data?.find(
    (item) => String(item.id) === category || item.slug === category,
  )
  const activeTag = tags?.data?.find(
    (item) => String(item.id) === tag || item.slug === tag,
  )
  return (
    <>
      <SEO title={searchMode ? '搜索与发现' : '所有文章'} />
      <div className="site-width page-space">
        <header className="page-intro">
          <span className="eyebrow">
            {searchMode
              ? 'FOLLOW YOUR CURIOSITY'
              : 'WORDS, IDEAS & EVERYTHING IN BETWEEN'}
          </span>
          <h1>{searchMode ? '寻找共鸣的那一篇。' : '文字里的小小宇宙。'}</h1>
          <p>
            {searchMode
              ? '从一个关键词出发，和新的想法不期而遇。'
              : '技术的探索，生活的切片，值得留下的每一个瞬间。'}
          </p>
        </header>
        <div className="blog-columns">
          <div className="min-w-0">
            <SearchField
              key={q}
              value={q}
              onSearch={(value) => update('q', value)}
            />
            <div className="category-tabs" aria-label="按分类筛选">
              <button
                aria-pressed={!category}
                className={!category ? 'selected' : ''}
                onClick={() => update('category', '')}
              >
                全部文章
              </button>
              {categories?.data?.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={String(item.id) === category}
                  className={String(item.id) === category ? 'selected' : ''}
                  onClick={() => update('category', item.id)}
                >
                  {item.name}
                  <span>{item.post_count || 0}</span>
                </button>
              ))}
            </div>
            <div className="discovery-toolbar" id="discovery-results">
              <span className="result-count" role="status">
                {isLoading
                  ? '正在找寻…'
                  : error
                    ? '加载失败'
                    : `${result?.total || 0} 篇文章`}
              </span>
              <div className="toolbar-controls">
                <SlidersHorizontal size={15} />
                <label className="sr-only" htmlFor="tag-filter">
                  按标签筛选
                </label>
                <select
                  id="tag-filter"
                  value={tag}
                  onChange={(event) => update('tag', event.target.value)}
                >
                  <option value="">所有标签</option>
                  {tags?.data?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="post-sort">
                  文章排序
                </label>
                <select
                  id="post-sort"
                  value={sort}
                  onChange={(event) => update('sort', event.target.value)}
                >
                  <option value="newest">最新发布</option>
                  <option value="oldest">最早发布</option>
                  <option value="popular">最多阅读</option>
                </select>
                <div className="view-toggle">
                  <button
                    aria-label="卡片视图"
                    aria-pressed={view === 'grid'}
                    onClick={() => setView('grid')}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    aria-label="列表视图"
                    aria-pressed={view === 'list'}
                    onClick={() => setView('list')}
                  >
                    <List size={17} />
                  </button>
                </div>
              </div>
            </div>
            {(q || category || tag) && (
              <div className="active-filters">
                {q && (
                  <button onClick={() => update('q', '')}>
                    “{q}”<X size={13} />
                  </button>
                )}
                {category && (
                  <button onClick={() => update('category', '')}>
                    {activeCategory?.name || '当前分类'}
                    <X size={13} />
                  </button>
                )}
                {tag && (
                  <button onClick={() => update('tag', '')}>
                    # {activeTag?.name || '当前标签'}
                    <X size={13} />
                  </button>
                )}
                <button className="clear-filters" onClick={() => setParams({})}>
                  清除筛选
                </button>
              </div>
            )}
            {error ? (
              <QueryState error={error} retry={refetch} />
            ) : (
              <PostList
                posts={result?.posts}
                isLoading={isLoading}
                view={view}
              />
            )}
            {!error && !isLoading && (
              <Pagination
                page={page}
                totalPages={result?.total_pages || 0}
                onChange={changePage}
              />
            )}
          </div>
          <BlogSidebar />
        </div>
      </div>
    </>
  )
}
