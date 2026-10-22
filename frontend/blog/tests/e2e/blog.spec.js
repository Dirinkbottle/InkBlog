import { test, expect } from '@playwright/test'
import { mockAPI, posts } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockAPI(page)
})

test('home stays put, navigation and persistent theme work', async ({
  page,
}) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /以文字为舟/ })).toBeVisible()
  await expect(page.locator('.post-card')).toHaveCount(7)
  await page.waitForTimeout(3200)
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole('button', { name: '切换明暗主题' }).click()
  await expect(page.locator('html')).toHaveClass('dark')
  await page.reload()
  await expect(page.locator('html')).toHaveClass('dark')
  await page.keyboard.press('Control+k')
  await expect(page).toHaveURL(/\/search/)
  await expect(
    page.getByRole('heading', { name: '寻找共鸣的那一篇。' }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('filters, search, sorting, pagination and browser history keep URL state', async ({
  page,
}) => {
  await page.goto('/posts')
  await expect(page.locator('.post-card')).toHaveCount(12)
  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.locator('.post-card h2').first()).toContainText(
    '探索笔记 13',
  )
  await page.getByRole('button', { name: /技术探索\s*16/ }).click()
  await expect(page).not.toHaveURL(/page=/)
  await page.selectOption('#tag-filter', '1')
  await page.selectOption('#post-sort', 'oldest')
  await expect(page.locator('.post-card h2').first()).toContainText(
    '探索笔记 16',
  )
  await page.getByRole('textbox', { name: '搜索文章关键词' }).fill('React')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await expect(page.locator('.post-card')).toHaveCount(1)
  await expect(page).toHaveURL(/q=React/)
  await page.reload()
  await expect(
    page.getByRole('textbox', { name: '搜索文章关键词' }),
  ).toHaveValue('React')
  await page.getByRole('button', { name: '列表视图' }).click()
  await expect(page.locator('.post-grid')).toHaveClass(/post-grid-list/)
  await page.getByRole('button', { name: '清除筛选' }).click()
  await expect(page.locator('.post-card')).toHaveCount(12)
  await page.goBack()
  await expect(
    page.getByRole('textbox', { name: '搜索文章关键词' }),
  ).toHaveValue('React')
})

test('bookmarks persist, sync between tabs, and can be removed', async ({
  page,
  context,
}) => {
  await page.goto('/posts')
  await page.getByRole('button', { name: '加入稍后读' }).first().click()
  await page.goto('/library')
  await expect(page.locator('.post-card')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.post-card')).toHaveCount(1)
  const second = await context.newPage()
  await mockAPI(second)
  await second.goto('/library')
  await expect(second.locator('.post-card')).toHaveCount(1)
  await page.getByRole('button', { name: '移出稍后读' }).click()
  await expect(second.locator('.post-card')).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: '留一点好奇，给下一次阅读' }),
  ).toBeVisible()
})

test('reader TOC, progress, font size, focus, image preview and sanitizer work', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/posts/1')
  await expect(
    page.getByRole('heading', { name: posts[0].title, exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: '文章目录' }).getByRole('link'),
  ).toHaveCount(3)
  await page.getByRole('button', { name: '放大字号' }).click()
  await expect(page.locator('.reading-article')).toHaveAttribute(
    'style',
    /18px/,
  )
  await page
    .getByRole('navigation', { name: '文章目录' })
    .getByRole('link', { name: '记录与实践' })
    .click()
  await expect(page).toHaveURL(/#ink-section-2$/)
  await page.getByRole('button', { name: '复制代码' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "const garden = 'stay curious'",
  )
  await page.getByRole('button', { name: '专注阅读' }).click()
  await expect(page.locator('.reader-page')).toHaveClass(/focus-reading/)
  await page.getByRole('button', { name: '退出专注' }).click()
  await page.getByRole('button', { name: '查看大图：测试图片' }).click()
  await expect(page.getByRole('dialog', { name: '图片预览' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()
  await expect(page.locator('.markdown-body iframe')).toHaveCount(0)
  await expect(page.locator('.markdown-body [onerror]')).toHaveCount(0)
  await page.goto('/library?tab=history')
  await expect(page.locator('.history-entry')).toHaveCount(1)
  await page.getByRole('button', { name: '清除阅读足迹' }).click()
  await page.getByRole('button', { name: '确认清除' }).click()
  await expect(page.locator('.history-entry')).toHaveCount(0)
})

test('archive links, user profile cards, empty results and not-found are usable', async ({
  page,
}) => {
  await page.goto('/archives')
  await expect(page.locator('.archive-entry')).toHaveCount(26)
  await page.locator('.year-links button').filter({ hasText: '2026' }).click()
  await expect(page).toHaveURL(/year=2026/)
  await page.locator('.archive-entry').first().click()
  await expect(page).toHaveURL(/\/posts\/1/)
  await page.goto('/users/1')
  await expect(page.locator('.post-card')).toHaveCount(10)
  await page.goto('/posts?q=nomatch')
  await expect(
    page.getByRole('heading', { name: '这里还没有文章' }),
  ).toBeVisible()
  await page.goto('/posts/9999')
  await expect(
    page.getByRole('heading', { name: '这篇文章暂时无法访问' }),
  ).toBeVisible()
})

test('network errors show retry and recover', async ({ page }) => {
  await mockAPI(page, { failPosts: true })
  await page.goto('/posts')
  await expect(
    page.getByRole('heading', { name: '内容暂时没有加载出来' }),
  ).toBeVisible()
  await mockAPI(page)
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.locator('.post-card')).toHaveCount(12)
})

test('mobile layouts do not overflow and navigation closes after selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/', '/posts', '/archives', '/library', '/posts/1']) {
    await page.goto(path)
    await expect(page.locator('.site-footer')).toBeAttached()
    await expect(page.locator('main h1')).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
  }
  await page.getByRole('button', { name: '打开菜单' }).click()
  await page
    .getByRole('navigation', { name: '移动导航' })
    .getByRole('link', { name: '阅读书房' })
    .click()
  await expect(page).toHaveURL(/\/library/)
  await expect(page.getByRole('button', { name: '打开菜单' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})

test('system theme follows the OS and toggles from its resolved color', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.addInitScript(() =>
    localStorage.setItem(
      'theme-storage',
      JSON.stringify({ state: { theme: 'system' }, version: 0 }),
    ),
  )
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass('dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveClass('light')
  await page.getByRole('button', { name: '切换明暗主题' }).click()
  await expect(page.locator('html')).toHaveClass('dark')
})

test('saved reading position offers a working resume action', async ({
  page,
}) => {
  await page.addInitScript(
    (post) =>
      localStorage.setItem(
        'inkblog-reading-library-v1',
        JSON.stringify({
          bookmarks: [],
          history: [
            { ...post, progress: 45, readAt: new Date().toISOString() },
          ],
        }),
      ),
    posts[0],
  )
  await page.goto('/posts/1')
  await expect(page.getByText('上次读到 45%，接着读吧。')).toBeVisible()
  await page.getByRole('button', { name: '继续上次阅读 →' }).click()
  await expect(page.locator('.resume-note')).toHaveCount(0)
  await expect
    .poll(async () =>
      Number(
        await page
          .getByRole('progressbar', { name: '阅读进度' })
          .getAttribute('aria-valuenow'),
      ),
    )
    .toBeGreaterThan(35)
})

test('administrator can customize the home page through existing settings', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: { id: 1, username: 'Admin', role: 'admin' },
          token: 'test-token',
          isAuthenticated: true,
        },
        version: 0,
      }),
    ),
  )
  await page.route('**/api/v1/auth/profile', route => route.fulfill({ json: { data: { id: 1, username: 'Admin', role: 'admin' } } }))
  let settings = {
    site_name: 'InkBlog',
    hero_title: '',
    hero_description: '',
    site_description: '介绍',
    site_purpose: '记录',
  }
  await page.route('**/api/v1/admin/settings', async (route) => {
    if (route.request().method() === 'PUT')
      settings = route.request().postDataJSON()
    await route.fulfill({ json: { data: settings } })
  })
  await page.route('**/api/v1/settings', (route) =>
    route.fulfill({ json: { data: settings } }),
  )
  await page.goto('/admin/settings')
  await page.getByLabel('首页标题', { exact: true }).fill('记录我的技术旅程')
  await page
    .getByLabel('首页简介', { exact: true })
    .fill('关于开源与创造的日常')
  await page.getByRole('button', { name: '保存设置' }).click()
  await expect.poll(() => settings.hero_title).toBe('记录我的技术旅程')
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: '记录我的技术旅程' }),
  ).toBeVisible()
  await expect(page.getByText('关于开源与创造的日常')).toBeVisible()
})

test('unavailable local storage keeps the page and session bookmarks usable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (this === window.localStorage)
        throw new DOMException('Storage unavailable', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.goto('/posts')
  await expect(page.locator('.post-card')).toHaveCount(12)
  await page.getByRole('button', { name: '加入稍后读' }).first().click()
  await page
    .getByRole('navigation', { name: '主导航' })
    .getByRole('link', { name: '阅读书房' })
    .click()
  await expect(page.locator('.post-card')).toHaveCount(1)
  await expect(
    page.getByText('浏览器存储不可用，当前记录无法持久保存。'),
  ).toBeVisible()
})
