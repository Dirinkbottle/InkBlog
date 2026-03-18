import React from 'react'
import PostTableRow from './PostTableRow'

export default function PostTable({ posts, isLoading, onDelete, onPublish, navigate }) {
  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">加载中...</div>
  }

  if (!posts || posts.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">暂无文章</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left">
            <th className="p-4 font-medium">标题</th>
            <th className="p-4 font-medium">分类</th>
            <th className="p-4 font-medium">状态</th>
            <th className="p-4 font-medium">浏览</th>
            <th className="p-4 font-medium">创建时间</th>
            <th className="p-4 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <PostTableRow
              key={post.id}
              post={post}
              onDelete={onDelete}
              onPublish={onPublish}
              navigate={navigate}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
