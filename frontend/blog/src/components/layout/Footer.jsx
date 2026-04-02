import React from 'react'
import { useSetting } from '@/hooks/useSettings'

export default function Footer() {
  const footerText = useSetting('footer_text', `© ${new Date().getFullYear()} InkBlog. All rights reserved.`)
  const icpNumber = useSetting('icp_number', '')

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-zinc-500">
        <p className="mx-auto max-w-3xl break-words leading-6">{footerText}</p>
        {icpNumber && (
          <p className="mt-2">
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-zinc-900"
              aria-label={`工信部备案号 ${icpNumber}`}
            >
              {icpNumber}
            </a>
          </p>
        )}
      </div>
    </footer>
  )
}
