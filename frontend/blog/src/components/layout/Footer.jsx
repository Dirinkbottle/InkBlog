import React from 'react'
import { Link } from 'react-router-dom'
import { Feather, ArrowUpRight, Rss } from 'lucide-react'
import { useSetting } from '@/hooks/useSettings'

export default function Footer() {
  const siteName = useSetting('site_name', 'InkBlog')
  const footerText = useSetting(
    'footer_text',
    `© ${new Date().getFullYear()} InkBlog. All rights reserved.`,
  )
  const icpNumber = useSetting('icp_number', '')
  return (
    <footer className="site-footer">
      <div className="site-width">
        <div className="footer-top">
          <div>
            <Link className="brand" to="/">
              <Feather size={23} />
              {siteName}
            </Link>
            <p>让文字留下来，让想法走远一点。</p>
          </div>
          <div className="footer-links">
            <Link to="/archives">
              文章归档 <ArrowUpRight size={14} />
            </Link>
            <Link to="/library">
              阅读书房 <ArrowUpRight size={14} />
            </Link>
            <a href="/api/v1/feed.xml" target="_blank" rel="noreferrer">
              <Rss size={14} /> RSS 订阅
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{footerText}</span>
          <span>
            {icpNumber && (
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {icpNumber}
              </a>
            )}
            <span className="footer-sign">Made with curiosity.</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
