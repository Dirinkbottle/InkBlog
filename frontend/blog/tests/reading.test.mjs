import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizePage,
  normalizeLibrary,
  readingSnapshot,
  archiveGroups,
  dateLabel,
} from '../src/lib/reading.js'

test('pagination rejects malformed, fractional, negative and unbounded input', () => {
  for (const value of [null, '', 'abc', '-2', '0', '1.5', 'Infinity', '1e20'])
    assert.equal(normalizePage(value), 1)
  assert.equal(normalizePage('12'), 12)
})
test('library recovers malformed data and bounds progress and storage size', () => {
  assert.deepEqual(normalizeLibrary(null), { bookmarks: [], history: [] })
  const data = normalizeLibrary({
    bookmarks: [null, { id: -1, title: 'bad' }, { id: 1, title: 'valid' }],
    history: [{ id: 2, title: 'read', progress: 200 }],
  })
  assert.equal(data.bookmarks.length, 1)
  assert.equal(data.history[0].progress, 100)
  assert.equal(
    normalizeLibrary({
      bookmarks: Array.from({ length: 250 }, (_, i) => ({
        id: i + 1,
        title: 'a',
      })),
    }).bookmarks.length,
    200,
  )
})
test('local snapshots contain only public metadata', () => {
  const snapshot = readingSnapshot({
    id: 1,
    title: 'a',
    content: 'full body',
    token: 'private',
    author: { id: 1, username: 'writer', email: 'private@example.test' },
  })
  assert.equal(snapshot.content, undefined)
  assert.equal(snapshot.token, undefined)
  assert.equal(snapshot.author.email, undefined)
})
test('archives use publication date, group missing dates safely, and preserve order', () => {
  const posts = [
    { id: 1, published_at: '2026-02-12T12:00:00Z', created_at: '2025-01-01' },
    { id: 2, created_at: '2026-02-10' },
    { id: 3 },
  ]
  const groups = archiveGroups(posts)
  assert.equal(groups.length, 2)
  assert.equal(groups[0].label, '2026 年 02 月')
  assert.equal(groups[0].posts.length, 2)
  assert.equal(dateLabel(posts[2]), '日期待更新')
})
