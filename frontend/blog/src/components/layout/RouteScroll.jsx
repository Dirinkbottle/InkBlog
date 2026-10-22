import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteScroll() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Hash links are handled after the article and its headings have rendered.
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}
