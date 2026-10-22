import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Circle,
  Feather,
} from 'lucide-react'
import { usePosts } from '../hooks/usePosts'
import { useCategories } from '../hooks/useCategories'
import { useSetting } from '../hooks/useSettings'
import api from '../services/api'
import SEO from '../components/SEO'
import PostCard from '../components/post/PostCard'
import PostList from '../components/post/PostList'
import BlogSidebar from '../components/discovery/BlogSidebar'
import QueryState from '../components/discovery/QueryState'

export default function Welcome() {
  const { data, isLoading, error, refetch } = usePosts({
    page: 1,
    page_size: 7,
    sort: 'newest',
    status: 'published',
  })
  const { data: categories } = useCategories()
  const { data: statistics } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => api.get('/statistics'),
    staleTime: 300000,
  })
  const heroTitle = useSetting('hero_title', '')
  const heroDescription = useSetting('hero_description', '')
  const description = useSetting(
    'site_description',
    '关于技术、生活，以及一路上的奇思妙想。这里是我的数字花园，也是与你交换灵感的地方。',
  )
  const posts = data?.data?.posts || []
  return (
    <>
      <SEO />
      <div className="site-width">
        <section className="home-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" /> A SPACE FOR THOUGHTS
            </span>
            <h1>
              {heroTitle || (
                <>
                  以文字为舟，
                  <br />
                  在好奇中<span>远行。</span>
                </>
              )}
            </h1>
            <p>{heroDescription || description}</p>
            <div className="hero-actions">
              <Link className="ink-button" to="/posts">
                开始阅读 <ArrowRight size={17} />
              </Link>
              <Link className="quiet-link" to="/archives">
                沿着时间漫步 <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="hero-stats">
              <span>
                <strong>{statistics?.data?.post_count ?? '—'}</strong> 篇文字
              </span>
              <span>
                <strong>{categories?.data?.length ?? '—'}</strong> 个主题
              </span>
              <span>
                <strong>
                  {statistics?.data?.view_count?.toLocaleString() ?? '—'}
                </strong>{' '}
                次相遇
              </span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="art-grid" />
            <span className="art-orbit" />
            <div className="art-caption">
              COLLECTING MOMENTS
              <br />& CONNECTING DOTS.
            </div>
            <div className="note-paper paper-back" />
            <div className="note-paper paper-front">
              <Feather size={29} />
              <span className="paper-kicker">NOTES TO SELF</span>
              <div className="paper-title">
                把日常的碎片，
                <br />
                写成自己的
                <br />
                <em>星图。</em>
              </div>
              <span className="paper-line" />
              <span className="paper-line short" />
              <div className="paper-footer">
                <Circle size={9} /> STAY CURIOUS <span>01 / ∞</span>
              </div>
            </div>
            <span className="art-sticker">
              灵感
              <br />
              不打烊 ↗
            </span>
            <span className="art-star">✳</span>
            <span className="art-bottom">A SMALL CORNER OF THE INTERNET</span>
          </div>
        </section>
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE JOURNAL</span>
            <h2>
              最近的记录<span>每一次落笔，都是新的发现。</span>
            </h2>
          </div>
          <Link className="quiet-link" to="/posts">
            所有文章 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="blog-columns">
          <div className="min-w-0">
            {error ? (
              <QueryState error={error} retry={refetch} />
            ) : isLoading ? (
              <PostList isLoading />
            ) : posts.length ? (
              <>
                <PostCard post={posts[0]} featured />
                <PostList posts={posts.slice(1)} />
              </>
            ) : (
              <QueryState
                title="故事，即将从这里开始"
                description="第一篇文字还在酝酿。欢迎回来，见证这个小小花园的生长。"
              />
            )}
            {!!posts.length && (
              <Link className="all-posts-link" to="/posts">
                <BookOpen size={18} /> 去文章里，发现更多{' '}
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
          <BlogSidebar />
        </div>
      </div>
    </>
  )
}
