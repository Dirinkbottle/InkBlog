import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-8xl font-bold text-primary/20 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">页面未找到</h2>
      <p className="text-muted-foreground mb-8">
        你访问的页面不存在或已被移除
      </p>
      <Link to="/posts">
        <Button className="gap-2">
          <Home className="h-4 w-4" />
          返回首页
        </Button>
      </Link>
    </div>
  )
}
