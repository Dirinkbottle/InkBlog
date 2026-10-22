import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Rss, Sparkles } from 'lucide-react'
import { useCategories, useTags } from '../../hooks/useCategories'
import { useSetting } from '../../hooks/useSettings'

export default function BlogSidebar() {
  const { data: categories } = useCategories()
  const { data: tags } = useTags()
  const purpose = useSetting(
    'site_purpose',
    '记录技术成长，分享开发经验。把值得记住的事，慢慢写下来。',
  )
  return (
    <aside className="blog-sidebar">
      <section className="sidebar-note">
        <Sparkles size={22} />
        <span className="eyebrow">A LITTLE NOTE</span>
        <h2>
          保持好奇，
          <br />
          持续生长。
        </h2>
        <p>{purpose}</p>
        <Link className="text-link" to="/archives">
          翻阅时间里的足迹 <ArrowUpRight size={16} />
        </Link>
      </section>
      {!!categories?.data?.length && (
        <section className="sidebar-section">
          <h2>
            内容分类 <span>CATEGORIES</span>
          </h2>
          <div className="category-list">
            {categories.data.map((category) => (
              <Link key={category.id} to={`/posts?category=${category.id}`}>
                <span>{category.name}</span>
                <span>
                  {category.post_count || 0}
                  <ArrowUpRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {!!tags?.data?.length && (
        <section className="sidebar-section">
          <h2>
            灵感标签 <span>TOPICS</span>
          </h2>
          <div className="tag-cloud">
            {tags.data
              .filter((tag) => tag.post_count > 0)
              .slice(0, 18)
              .map((tag) => (
                <Link key={tag.id} to={`/posts?tag=${tag.id}`}>
                  # {tag.name}
                </Link>
              ))}
          </div>
        </section>
      )}
      <a
        className="rss-note"
        href="/api/v1/feed.xml"
        target="_blank"
        rel="noreferrer"
      >
        <Rss size={20} />
        <div>
          <strong>订阅文字的更新</strong>
          <span>用你喜欢的 RSS 阅读器，慢慢读。</span>
        </div>
        <ArrowUpRight size={16} />
      </a>
    </aside>
  )
}
