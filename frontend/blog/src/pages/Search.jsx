import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import { Input } from '../components/ui/input'
import PostList from '../components/post/PostList'
import { postAPI } from '../services/api'
import { debounce } from '@/lib/utils'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(
    debounce(async (q) => {
      if (!q.trim()) {
        setResults([])
        setSearched(false)
        return
      }
      setLoading(true)
      setSearched(true)
      try {
        const res = await postAPI.getList({ search: q.trim(), page: 1, page_size: 20 })
        setResults(res.data?.posts || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400),
    []
  )

  useEffect(() => {
    if (query) doSearch(query)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setSearchParams(val ? { q: val } : {})
    doSearch(val)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-center mb-6">搜索文章</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={handleChange}
            placeholder="输入关键词搜索..."
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : searched ? (
        results.length > 0 ? (
          <PostList posts={results} />
        ) : (
          <p className="text-center text-muted-foreground py-12">
            没有找到与 "{query}" 相关的文章
          </p>
        )
      ) : (
        <p className="text-center text-muted-foreground py-12">
          输入关键词开始搜索
        </p>
      )}
    </div>
  )
}
