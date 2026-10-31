// Deterministic API fixtures for UI regression only. Production pages never use these.
export const categories = [
  { id: 1, name: '技术探索', post_count: 16 },
  { id: 2, name: '生活随笔', post_count: 10 },
  { id: 3, name: '开源手记', post_count: 0 },
]
export const tags = [
  { id: 1, name: 'React', post_count: 16 },
  { id: 2, name: '随想', post_count: 10 },
]
const titles = [
  '把博客当作数字花园，慢慢种下自己的想法',
  '从零理解 React：让状态管理回归简单',
  '在代码之外，寻找生活的留白',
  '我的开源工作流：从一个想法到一次发布',
  '重新认识 CSS：那些让界面更舒服的细节',
  '写给未来的自己：保持好奇，保持创造',
]
export const posts = Array.from({ length: 26 }, (_, i) => ({
  id: i + 1,
  title: i < 6 ? titles[i] : `探索笔记 ${i + 1}：记录每一个微小的发现`,
  summary:
    '记录那些值得被记住的想法。在技术与生活的交汇处，寻找自己的表达，也期待与你发生新的连接。',
  created_at: `2026-${i < 16 ? '10' : '09'}-${String(28 - i).padStart(2, '0')}T12:00:00Z`,
  published_at: `2026-${i < 16 ? '10' : '09'}-${String(28 - i).padStart(2, '0')}T12:00:00Z`,
  category: categories[i < 16 ? 0 : 1],
  tags: [tags[i < 16 ? 0 : 1]],
  author: { id: 1, username: 'Dirinkbottle' },
  views: 1024 - i * 13,
  comment_count: i % 5,
  content: `## 从一个想法开始\n\n${'有些想法，需要留一点时间慢慢生长。记录、思考、分享，让文字成为连接彼此的桥梁。\n\n'.repeat(9)}### 记录与实践\n\n把好奇变成行动。\n\n\`\`\`js\nconst garden = 'stay curious'\nconsole.log(garden)\n\`\`\`\n\n## 继续生长\n\n${'写作的意义，在于让模糊的想法逐渐清晰。\n\n'.repeat(13)}![测试图片](/test-image.svg)\n\n<script>window.__xss = true</script><img src="/test-image.svg" onerror="window.__xss = true"><iframe src="https://example.com"></iframe>`,
}))

export async function mockAPI(page, options = {}) {
  await page.route('**/test-image.svg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="#cedabe"/></svg>',
    }),
  )
  await page.route('**/events/notifications/**', (route) =>
    route.fulfill({
      contentType: 'text/event-stream',
      body: ': connected\n\n',
    }),
  )
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/api/v1', '')
    const params = url.searchParams
    let data = {}
    if (path === '/install/status') data = { installed: true }
    else if (path === '/settings')
      data = {
        site_name: 'InkBlog',
        site_description:
          '关于技术、生活，以及一路上的奇思妙想。这里是我的数字花园，也是与你交换灵感的地方。',
        site_purpose:
          '记录技术成长，分享开发经验。把值得记住的事，慢慢写下来。',
      }
    else if (path === '/statistics')
      data = {
        post_count: 26,
        view_count: 12580,
        user_count: 1,
        comment_count: 38,
      }
    else if (path === '/categories') data = categories
    else if (path === '/tags') data = tags
    else if (path === '/archives')
      data = {
        total: 26,
        months: [
          { year: 2026, month: 10, count: 16 },
          { year: 2026, month: 9, count: 10 },
        ],
      }
    else if (path === '/posts' || path === '/users/1/posts') {
      if (options.failPosts)
        return route.fulfill({ status: 500, json: { message: '测试网络故障' } })
      let result = [...posts]
      if (params.get('category_id'))
        result = result.filter(
          (post) => String(post.category.id) === params.get('category_id'),
        )
      if (params.get('tag_id'))
        result = result.filter((post) =>
          post.tags.some((tag) => String(tag.id) === params.get('tag_id')),
        )
      if (params.get('search'))
        result = result.filter((post) =>
          post.title.includes(params.get('search')),
        )
      if (params.get('year'))
        result = result.filter((post) =>
          post.published_at.startsWith(params.get('year')),
        )
      if (params.get('sort') === 'oldest') result.reverse()
      const pageNumber = Number(params.get('page') || 1),
        size = Number(params.get('page_size') || 12)
      data = {
        posts: result.slice((pageNumber - 1) * size, pageNumber * size),
        page: pageNumber,
        total: result.length,
        total_pages: Math.ceil(result.length / size),
      }
    } else if (/^\/posts\/\d+$/.test(path)) {
      data = posts.find((post) => post.id === Number(path.split('/').pop()))
      if (!data)
        return route.fulfill({ status: 404, json: { message: '文章不存在' } })
    } else if (path.startsWith('/comments'))
      data = { comments: [], total: 0, total_pages: 0 }
    else if (path === '/users/1')
      data = {
        id: 1,
        username: 'Dirinkbottle',
        post_count: 26,
        created_at: '2025-01-01',
      }
    await route.fulfill({ json: { code: 200, data } })
  })
}
