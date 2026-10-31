export function postDate(post) {
  const date = new Date(post.published_at || post.created_at)
  return Number.isNaN(date.getTime()) ? null : date
}

export function dateLabel(post, short = false) {
  return (
    postDate(post)?.toLocaleDateString(
      'zh-CN',
      short
        ? { month: '2-digit', day: '2-digit', timeZone: 'UTC' }
        : { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' },
    ) || '日期待更新'
  )
}

export function archiveGroups(posts = []) {
  return posts.reduce((groups, post) => {
    const date = postDate(post)
    const key = date
      ? `${date.getUTCFullYear()} 年 ${String(date.getUTCMonth() + 1).padStart(2, '0')} 月`
      : '未标注日期'
    const group = groups.find((item) => item.label === key)
    if (group) group.posts.push(post)
    else groups.push({ label: key, posts: [post] })
    return groups
  }, [])
}

export function normalizePage(value) {
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 && page <= 1000000 ? page : 1
}

// Keep only public card metadata, never article bodies or account credentials.
export function readingSnapshot(post) {
  return {
    id: post.id,
    title: post.title,
    summary: post.summary || '',
    cover_image: post.cover_image || '',
    created_at: post.created_at,
    published_at: post.published_at,
    category: post.category,
    tags: post.tags || [],
    author: post.author
      ? { id: post.author.id, username: post.author.username }
      : null,
    views: post.views || 0,
    comment_count: post.comment_count || 0,
  }
}

export function normalizeLibrary(value) {
  const valid = (items) =>
    Array.isArray(items)
      ? items.filter(
          (item) =>
            Number.isSafeInteger(item?.id) &&
            item.id > 0 &&
            typeof item.title === 'string',
        )
      : []
  return {
    bookmarks: valid(value?.bookmarks).slice(0, 200).map(readingSnapshot),
    history: valid(value?.history)
      .slice(0, 50)
      .map((item) => ({
        ...readingSnapshot(item),
        progress: Math.max(0, Math.min(100, Number(item.progress) || 0)),
        readAt: item.readAt,
      })),
  }
}

export async function copyText(text) {
  if (!navigator.clipboard?.writeText)
    throw new Error('当前浏览器无法访问剪贴板，请手动复制')
  await navigator.clipboard.writeText(text)
}
