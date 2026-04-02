import React from 'react'
import { useSetting } from '@/hooks/useSettings'

export default function Footer() {
  const footerText = useSetting('footer_text', `© ${new Date().getFullYear()} InkBlog. All rights reserved.`)
  const icpNumber = useSetting('icp_number', '')

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-500">
        <p>{footerText}</p>
        {icpNumber && (
          <p className="mt-2">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">
              {icpNumber}
            </a>
          </p>
        )}
      </div>
    </footer>
  )
}
