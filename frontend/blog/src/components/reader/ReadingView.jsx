import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  List,
  Maximize2,
  Minimize2,
  Share2,
  Minus,
  Plus,
  ArrowUp,
} from 'lucide-react'
import { toast } from 'sonner'
import PostDetail from '../post/PostDetail/index'
import PostList from '../post/PostList'
import CommentSection from '../post/CommentSection/index'
import BookmarkButton from './BookmarkButton'
import useReadingStore from '../../store/readingStore'
import { copyText } from '../../lib/reading'
import { usePosts } from '../../hooks/usePosts'

export default function ReadingView({ post }) {
  const articleRef = useRef(null)
  const [headings, setHeadings] = useState([])
  const [active, setActive] = useState('')
  const [progress, setProgress] = useState(0)
  const [focus, setFocus] = useState(false)
  const [fontSize, setFontSize] = useState(() => {
    try {
      return Math.min(
        23,
        Math.max(15, Number(localStorage.getItem('inkblog-reader-size')) || 17),
      )
    } catch {
      return 17
    }
  })
  const [previousProgress, setPreviousProgress] = useState(
    () =>
      useReadingStore.getState().history.find((item) => item.id === post.id)
        ?.progress || 0,
  )
  const { data: related } = usePosts({
    category_id: post.category?.id,
    page: 1,
    page_size: 4,
    status: 'published',
  })

  useEffect(() => {
    const article = articleRef.current
    if (!article) return
    const elements = Array.from(
      article.querySelectorAll('.markdown-body h2, .markdown-body h3'),
    )
    const entries = elements.map((element, index) => {
      element.id = `ink-section-${index + 1}`
      return {
        id: element.id,
        text: element.textContent,
        level: element.tagName === 'H3' ? 3 : 2,
      }
    })
    setHeadings(entries)
    let frame = 0,
      currentProgress = 0,
      lastSaved = 0
    const measure = () => {
      frame = 0
      const rect = article.getBoundingClientRect()
      const distance = Math.max(1, rect.height - window.innerHeight + 130)
      currentProgress = Math.max(
        0,
        Math.min(100, ((130 - rect.top) / distance) * 100),
      )
      setProgress(currentProgress)
      let current = entries[0]?.id || ''
      for (const element of elements)
        if (element.getBoundingClientRect().top <= 165) current = element.id
      setActive(current)
      if (Date.now() - lastSaved > 2000) {
        useReadingStore.getState().remember(post, currentProgress)
        lastSaved = Date.now()
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    const save = () =>
      useReadingStore.getState().remember(post, currentProgress)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.addEventListener('pagehide', save)
    const resize =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(schedule)
        : null
    resize?.observe(article)
    measure()
    let hashFrame = requestAnimationFrame(() => {
      const target = entries.find(
        (item) => `#${item.id}` === window.location.hash,
      )
      if (target) document.getElementById(target.id)?.scrollIntoView()
    })
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(hashFrame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('pagehide', save)
      resize?.disconnect()
      save()
    }
  }, [post])

  const resizeText = (delta) => {
    const next = Math.min(23, Math.max(15, fontSize + delta))
    setFontSize(next)
    try {
      localStorage.setItem('inkblog-reader-size', String(next))
    } catch {
      /* Reading still works without persistence. */
    }
  }
  const share = async () => {
    try {
      await copyText(window.location.href)
      toast.success('文章链接已复制')
    } catch {
      toast.error('无法复制，请从地址栏复制文章链接')
    }
  }
  const resume = () => {
    const rect = articleRef.current.getBoundingClientRect()
    window.scrollTo({
      top:
        rect.top +
        window.scrollY -
        130 +
        (Math.max(1, rect.height - window.innerHeight + 130) *
          previousProgress) /
          100,
      behavior: 'smooth',
    })
    setPreviousProgress(0)
  }
  const relatedPosts =
    related?.data?.posts?.filter((item) => item.id !== post.id).slice(0, 3) ||
    []
  return (
    <div className={`site-width reader-page ${focus ? 'focus-reading' : ''}`}>
      <div
        className="reading-progress"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-label="阅读进度"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      />
      <nav className="reader-breadcrumb" aria-label="面包屑">
        <Link to="/">首页</Link>
        <span>/</span>
        <Link to="/posts">文章</Link>
        {post.category && (
          <>
            <span>/</span>
            <Link to={`/posts?category=${post.category.id}`}>
              {post.category.name}
            </Link>
          </>
        )}
      </nav>
      {previousProgress > 5 && previousProgress < 95 && (
        <div className="resume-note">
          <span>上次读到 {Math.round(previousProgress)}%，接着读吧。</span>
          <button onClick={resume}>继续上次阅读 →</button>
        </div>
      )}
      <div className="reading-layout">
        <div
          ref={articleRef}
          className="reading-article"
          style={{ '--reader-font': `${fontSize}px` }}
        >
          <PostDetail post={post} />
        </div>
        <aside className="reader-sidebar">
          <h2>让阅读，舒服一点。</h2>
          <div className="reader-toolbar">
            <BookmarkButton post={post} />
            <button className="ink-button secondary" onClick={share}>
              <Share2 size={15} />
              分享
            </button>
            <div className="font-controls">
              <button
                aria-label="缩小字号"
                disabled={fontSize <= 15}
                onClick={() => resizeText(-1)}
              >
                <Minus size={13} className="mx-auto" />
              </button>
              <span>{fontSize}</span>
              <button
                aria-label="放大字号"
                disabled={fontSize >= 23}
                onClick={() => resizeText(1)}
              >
                <Plus size={13} className="mx-auto" />
              </button>
            </div>
            <button
              className="ink-button secondary"
              aria-pressed={focus}
              onClick={() => setFocus((value) => !value)}
            >
              {focus ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              {focus ? '退出专注' : '专注阅读'}
            </button>
          </div>
          <section className="reader-toc">
            <h2>
              <List size={16} /> 本文目录
            </h2>
            {headings.length ? (
              <nav aria-label="文章目录">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    aria-current={
                      active === heading.id ? 'location' : undefined
                    }
                    className={`${active === heading.id ? 'active' : ''} ${heading.level === 3 ? 'subheading' : ''}`}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            ) : (
              <p>这篇文章适合一口气读完。</p>
            )}
          </section>
          <div className="reader-status">
            <span>已读 {Math.round(progress)}%</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="回到文章开头"
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </aside>
      </div>
      <div className="reader-comments">
        <CommentSection postId={post.id} />
      </div>
      {!!relatedPosts.length && (
        <section className="related-posts">
          <h2>沿着这个话题，再读一篇。</h2>
          <PostList posts={relatedPosts} />
        </section>
      )}
    </div>
  )
}
