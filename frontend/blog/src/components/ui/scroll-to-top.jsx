import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 rounded-full border-slate-300 bg-white/95 text-slate-700 shadow-sm transition-all duration-300 hover:bg-white hover:text-slate-900',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
      onClick={scrollToTop}
      aria-label="回到顶部"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}
