import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, symlink, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import {
  bundledContentDir,
  ContentStore,
  fetchGithubSnapshot,
  parseArticleMarkdown,
  parseContentSource,
  parseGithubRepo,
  parsePollMs,
  sanitizeArticleHtml,
  type GithubSyncState
} from '../src/content/index.js'

const silent = { info() {}, warn() {} }
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

function article(fields: Record<string, string | number>, body: string): string {
  const lines = ['---']
  for (const [key, value] of Object.entries({
    title: 'Title',
    excerpt: 'Excerpt',
    author: 'Author',
    date: '2026-01-02',
    price: 10,
    image: '/images/pic.png',
    ...fields
  })) {
    lines.push(`${key}: ${typeof value === 'string' ? JSON.stringify(value) : value}`)
  }
  lines.push('---', body)
  return lines.join('\n')
}

describe('front matter', () => {
  it('reads price, date, and image from Markdown', () => {
    const parsed = parseArticleMarkdown('hello-world', article({
      title: 'Hello: world',
      excerpt: 'A "quoted" excerpt',
      price: 42,
      date: '2026-04-20',
      image: '/images/pic.png'
    }, 'Paragraph with **bold**.\n\n## Section\n'))
    assert.equal(parsed.price, 42)
    assert.equal(parsed.date, '2026-04-20')
    assert.equal(parsed.title, 'Hello: world')
    assert.equal(parsed.excerpt, 'A "quoted" excerpt')
    assert.equal(parsed.image, '/images/pic.png')
    assert.match(parsed.content, /<strong>bold<\/strong>/)
    assert.match(parsed.content, /<h2>Section<\/h2>/)
  })

  it('keeps an unquoted YAML date as a calendar string', () => {
    const raw = `---
title: Hello
excerpt: Hi
author: Ada
date: 2026-04-20
price: 12
image: /images/pic.png
---
<p>Body</p>
`
    const parsed = parseArticleMarkdown('hello', raw)
    assert.equal(parsed.date, '2026-04-20')
    assert.equal(parsed.price, 12)
  })

  it('rejects unsafe or incomplete front matter', () => {
    assert.throws(() => parseArticleMarkdown('Hello', article({}, '<p>Body</p>')), /slug/)
    assert.throws(() => parseArticleMarkdown('hello', article({ price: 0 }, '<p>Body</p>')), /price/)
    assert.throws(() => parseArticleMarkdown('hello', article({ price: 1.5 }, '<p>Body</p>')), /price/)
    assert.throws(() => parseArticleMarkdown('hello', article({ date: '2026-02-31' }, '<p>Body</p>')), /date/)
    assert.throws(() => parseArticleMarkdown('hello', article({ image: 'https://evil.example/a.png' }, '<p>Body</p>')), /image/)
    assert.throws(() => parseArticleMarkdown('hello', article({ image: '/images/../../.env' }, '<p>Body</p>')), /image/)
  })
})

describe('sanitizer', () => {
  it('strips scripts and handlers and keeps the lead class', () => {
    const clean = sanitizeArticleHtml('<p class="lead" onclick="alert(1)">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)><iframe src="https://evil.example"></iframe>')
    assert.equal(clean.includes('<script'), false)
    assert.equal(clean.includes('onclick'), false)
    assert.equal(clean.includes('onerror'), false)
    assert.equal(clean.includes('javascript:'), false)
    assert.equal(clean.includes('<iframe'), false)
    assert.equal(clean.includes('<img'), false)
    assert.match(clean, /<p class="lead">Hi<\/p>/)
  })
})

describe('bundled articles', () => {
  it('migrates the four articles losslessly, newest first', async () => {
    const store = new ContentStore({ dir: bundledContentDir(), source: 'local', pollMs: 0, logger: silent })
    await store.loadInitial()
    const listed = store.getAllArticles()
    assert.deepEqual(listed.map(article => article.slug), [
      'agentpay-hackathon',
      'chronicle-activates',
      'tetheral-reserve-bank',
      'runar-playground'
    ])
    assert.deepEqual(listed.map(article => article.price), [150, 100, 200, 75])
    assert.equal(listed[0].image, '/images/g5.png')
    assert.equal(listed[1].image, '/images/g4.png')
    assert.equal(listed[2].image, '/images/g3.png')
    assert.equal(listed[3].image, '/images/g2.png')
    assert.equal(listed.every(article => article.author === 'Deigan Cullenskink'), true)

    const agentpay = store.getArticle('agentpay-hackathon')
    assert.ok(agentpay)
    assert.match(agentpay.content, /<p class="lead">ZUG, SWITZERLAND —/)
    assert.match(agentpay.content, /<h2>The Requirements<\/h2>/)
    assert.match(agentpay.content, /<h2>Agent Discovery on a Quiet Chain<\/h2>/)
    assert.match(agentpay.content, /agentic psychosis/)
    assert.equal(agentpay.content.includes('<script'), false)

    const runar = store.getArticle('runar-playground')
    assert.match(runar!.content, /Runár/)
    const tetheral = store.getArticle('tetheral-reserve-bank')
    assert.match(tetheral!.title, /Exposé/)
    assert.match(tetheral!.content, /Keyser Söze/)
    assert.equal(store.getImage('g5.png')?.contentType, 'image/png')
    assert.equal(store.getImage('g2.png')?.contentType, 'image/jpeg')
  })
})

describe('local content updates', () => {
  it('picks up added, changed, and removed files and ignores symlinks', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'now-times-'))
    try {
      await writeFile(path.join(dir, 'first-story.md'), article({ title: 'First', price: 11, date: '2026-02-01' }, '<p class="lead">First body</p>'))
      await mkdir(path.join(dir, 'images'))
      await writeFile(path.join(dir, 'images', 'pic.png'), PNG)
      await writeFile(path.join(dir, 'images', 'not-an-image.png'), '<script>alert(1)</script>')
      await symlink('/etc/passwd', path.join(dir, 'evil.md'))

      const store = new ContentStore({ dir, source: 'local', pollMs: 40, logger: silent })
      try {
        await store.loadInitial()
        assert.equal(store.getArticle('first-story')?.price, 11)
        assert.equal(store.getArticle('evil'), undefined)
        assert.equal(store.getImage('not-an-image.png'), undefined)
        assert.equal(store.getImage('pic.png')?.contentType, 'image/png')

        let seen = false
        store.start()
        await writeFile(path.join(dir, 'second-story.md'), article({ title: 'Second', price: 27, date: '2026-05-01' }, '<p>Second</p><script>alert(1)</script>'))
        const started = Date.now()
        while (Date.now() - started < 2000) {
          const loaded = store.getArticle('second-story')
          if (loaded?.price === 27) {
            seen = true
            assert.equal(loaded.content.includes('<script'), false)
            break
          }
          await new Promise(resolve => setTimeout(resolve, 20))
        }
        assert.equal(seen, true)

        await writeFile(path.join(dir, 'first-story.md'), article({ title: 'First', price: 13, date: '2026-02-01' }, '<p>Changed</p>'))
        const changed = await store.refresh()
        assert.equal(changed.kind, 'updated')
        assert.equal(store.getArticle('first-story')?.price, 13)

        await unlink(path.join(dir, 'second-story.md'))
        await store.refresh()
        assert.equal(store.getArticle('second-story'), undefined)
        assert.equal(store.getArticle('first-story')?.price, 13)
      } finally {
        store.stop()
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe('github snapshot', () => {
  it('uses conditional requests and keeps the last good set when the fetch fails', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'now-times-gh-'))
    const calls: string[] = []
    let etag = '"sha-1"'
    let commit = 'a'.repeat(40)
    let fail = false
    const files = new Map<string, { sha: string; bytes: Buffer }>([
      ['content/remote-story.md', { sha: '1'.repeat(40), bytes: Buffer.from(article({ title: 'Remote', price: 64, date: '2026-06-01' }, '<p>Remote body</p>')) }],
      ['content/images/pic.png', { sha: '2'.repeat(40), bytes: PNG }]
    ])

    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input)
      calls.push(url)
      if (fail) throw new Error('network down')
      const headers = new Headers(init?.headers)
      assert.equal(headers.get('authorization'), 'Bearer test-token')
      assert.equal(new URL(url).host, 'api.github.com')
      if (url.includes('/commits/')) {
        if (headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: { etag } })
        return json({ sha: commit, commit: { tree: { sha: 'c'.repeat(40) } } }, { etag })
      }
      if (url.includes('/git/trees/')) {
        return json({
          truncated: false,
          tree: [...files.entries()].map(([filePath, file]) => ({ path: filePath, type: 'blob', sha: file.sha, size: file.bytes.length }))
        })
      }
      if (url.includes('/git/blobs/')) {
        const sha = url.split('/').pop()?.split('?')[0]
        const file = [...files.values()].find(item => item.sha === sha)
        if (!file) return new Response('missing', { status: 404 })
        return json({ encoding: 'base64', size: file.bytes.length, content: file.bytes.toString('base64') })
      }
      return new Response('missing', { status: 404 })
    }

    try {
      await writeFile(path.join(dir, 'local-story.md'), article({ title: 'Local', price: 5, date: '2026-01-01' }, '<p>Local</p>'))
      await (await import('node:fs/promises')).mkdir(path.join(dir, 'images'))
      await writeFile(path.join(dir, 'images', 'pic.png'), PNG)
      const store = new ContentStore({
        dir,
        source: 'github',
        pollMs: 0,
        github: { owner: 'bsv-blockchain-demos', repo: '402-articles', branch: 'main', path: 'content', token: 'test-token' },
        fetchImpl,
        logger: silent
      })
      await store.loadInitial()
      assert.equal(store.getArticle('local-story')?.price, 5)

      const updated = await store.refresh()
      assert.equal(updated.kind, 'updated')
      assert.equal(store.getArticle('remote-story')?.price, 64)
      assert.equal(store.getArticle('local-story'), undefined)
      assert.ok(store.getImage('pic.png'))

      const treeCalls = () => calls.filter(url => url.includes('/git/trees/')).length
      const treesAfterFirst = treeCalls()
      const cached = await store.refresh()
      assert.equal(cached.kind, 'not-modified')
      assert.equal(treeCalls(), treesAfterFirst)

      fail = true
      const failed = await store.refresh({ force: true })
      assert.equal(failed.kind, 'failed')
      assert.equal(store.getArticle('remote-story')?.price, 64)
      fail = false

      commit = 'd'.repeat(40)
      etag = '"sha-2"'
      files.set('content/newer-story.md', { sha: '3'.repeat(40), bytes: Buffer.from(article({ title: 'Newer', price: 8, date: '2026-07-01' }, '<p>Newer</p>')) })
      const again = await store.refresh()
      assert.equal(again.kind, 'updated')
      assert.equal(store.getArticle('newer-story')?.price, 8)
      assert.equal(store.getArticle('remote-story')?.price, 64)

      files.clear()
      commit = '9'.repeat(40)
      etag = '"empty"'
      const emptied = await store.refresh()
      assert.equal(emptied.kind, 'failed')
      assert.equal(store.getArticle('remote-story')?.price, 64)
      assert.equal(store.getArticle('newer-story')?.price, 8)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('does not replace a good set with an empty or truncated remote', async () => {
    const state: GithubSyncState = { files: new Map() }
    const config = { owner: 'acme', repo: 'news', branch: 'main', path: 'content' }
    const truncated: typeof fetch = async (input) => {
      const url = String(input)
      if (url.includes('/commits/')) return json({ sha: 'e'.repeat(40), commit: { tree: { sha: 'f'.repeat(40) } } }, { etag: '"t"' })
      return json({ truncated: true, tree: [] })
    }
    const result = await fetchGithubSnapshot(config, state, truncated)
    assert.equal(result.kind, 'failed')
    if (result.kind === 'failed') assert.match(result.reason, /truncated/)
  })
})

describe('content configuration', () => {
  it('parses repo, source, and poll interval', () => {
    assert.deepEqual(parseGithubRepo('https://github.com/bsv-blockchain-demos/402-articles.git'), {
      owner: 'bsv-blockchain-demos',
      repo: '402-articles'
    })
    assert.equal(parseGithubRepo('not a repo'), null)
    assert.equal(parseGithubRepo('owner/../../etc'), null)
    assert.equal(parseContentSource(undefined), 'github')
    assert.equal(parseContentSource('local'), 'local')
    assert.equal(parsePollMs(undefined), 180_000)
    assert.equal(parsePollMs('0'), 0)
    assert.equal(parsePollMs('1000'), 15_000)
    assert.equal(parsePollMs('nope'), 180_000)
  })
})

function json(body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json', ...headers } })
}
