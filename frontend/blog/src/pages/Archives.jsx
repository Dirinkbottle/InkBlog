import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, CalendarDays } from 'lucide-react'
import api from '../services/api'
import { usePosts } from '../hooks/usePosts'
import { archiveGroups, dateLabel, normalizePage } from '../lib/reading'
import SEO from '../components/SEO'
import QueryState from '../components/discovery/QueryState'
import Pagination from '../components/discovery/Pagination'

export default function Archives() {
  const [params, setParams] = useSearchParams()
  const year = params.get('year') || ''
  const page = normalizePage(params.get('page'))
  const {
    data: archive,
    error: archiveError,
    refetch: refetchArchive,
  } = useQuery({
    queryKey: ['archives'],
    queryFn: () => api.get('/archives'),
    staleTime: 300000,
  })
  const { data, isLoading, error, refetch } = usePosts({
    page,
    page_size: 30,
    year,
    sort: 'newest',
    status: 'published',
  })
  const years = [
    ...new Set(archive?.data?.months?.map((item) => item.year) || []),
  ]
  const posts = data?.data?.posts || []
  return (
    <>
      <SEO title="时光归档" />
      <div className="site-width page-space archives-page">
        <header className="page-intro">
          <span className="eyebrow">A WALK THROUGH TIME</span>
          <h1>把日子，写成来路。</h1>
          <p>那些探索过的问题、认真生活的痕迹，都在这里。</p>
        </header>
        <div className="archive-layout">
          <aside className="archive-sidebar">
            <CalendarDays size={25} />
            <h2>时光索引</h2>
            <p>{archive?.data?.total ?? '—'} 篇文字，慢慢积累。</p>
            <div className="year-links">
              <button
                className={!year ? 'selected' : ''}
                onClick={() => setParams({})}
              >
                全部年份 <ArrowUpRight size={15} />
              </button>
              {years.map((item) => (
                <button
                  key={item}
                  className={String(item) === year ? 'selected' : ''}
                  onClick={() => setParams({ year: String(item) })}
                >
                  {item}
                  <span>
                    {archive.data.months
                      .filter((month) => month.year === item)
                      .reduce((sum, month) => sum + month.count, 0)}
                  </span>
                </button>
              ))}
            </div>
            {archiveError && (
              <button className="text-link" onClick={refetchArchive}>
                重新加载年份
              </button>
            )}
          </aside>
          <div className="archive-content">
            {error ? (
              <QueryState error={error} retry={refetch} />
            ) : isLoading ? (
              <div
                className="archive-loading skeleton"
                aria-label="正在加载归档"
              />
            ) : !posts.length ? (
              <QueryState title="这一页，还没有留下文字" />
            ) : (
              archiveGroups(posts).map((group) => (
                <section className="archive-month" key={group.label}>
                  <h2>
                    <span className="timeline-dot" />
                    {group.label}
                    <span>{group.posts.length} 篇 · 本页</span>
                  </h2>
                  {group.posts.map((post) => (
                    <Link
                      className="archive-entry"
                      key={post.id}
                      to={`/posts/${post.id}`}
                    >
                      <time>{dateLabel(post, true)}</time>
                      <div>
                        <h3>{post.title}</h3>
                        <span>
                          {post.category?.name || '随笔'}
                          {post.tags?.length
                            ? ` / ${post.tags.map((tag) => tag.name).join(' · ')}`
                            : ''}
                        </span>
                      </div>
                      <ArrowUpRight size={18} />
                    </Link>
                  ))}
                </section>
              ))
            )}
            {!error && !isLoading && (
              <Pagination
                page={page}
                totalPages={data?.data?.total_pages || 0}
                onChange={(next) => {
                  const values = new URLSearchParams(params)
                  values.set('page', next)
                  setParams(values)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
