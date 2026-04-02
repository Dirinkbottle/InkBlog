import React from 'react'
import PostTableRow from './PostTableRow'

export default function PostTable({ posts, isLoading, onDelete, onPublish, navigate }) {
  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 border border-slate-200 rounded-lg bg-white">加载中...</div>
  }

  if (!posts || posts.length === 0) {
    return <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-lg bg-white">暂无文章</div>
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr className="text-left">
            <th className="p-4 font-medium text-slate-700">标题</th>
            <th className="p-4 font-medium text-slate-700">分类</th>
            <th className="p-4 font-medium text-slate-700">状态</th>
            <th className="p-4 font-medium text-slate-700">浏览</th>
            <th className="p-4 font-medium text-slate-700">创建时间</th>
            <th className="p-4 font-medium text-right text-slate-700">操作</th>
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
