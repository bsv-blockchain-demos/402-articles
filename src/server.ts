import express, { NextFunction, Request, Response } from 'express'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { timingSafeEqual } from 'node:crypto'
import cors from 'cors'
import { createBsvPaymentMiddleware } from './middleware/payment.js'
import {
  bundledContentDir,
  ContentStore,
  escapeHtml,
  githubConfigFromEnv,
  parseContentSource,
  parsePollMs,
  type Article
} from './content/index.js'
import { doublePageHtml } from './double.js'
import { forwardAllowedPost, parseAllowHosts, ProxyError, ProxyLookup, ProxyRequester } from './proxy.js'
import { makeWallet, ServerWallet } from './wallet.js'

const PORT = 3000
const PAGE_CSP = "default-src 'none'; script-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'"

export interface CreateAppOptions {
  content?: ContentStore
  makeWallet?: () => Promise<ServerWallet>
  proxyAllowHosts?: string[]
  proxyLookup?: ProxyLookup
  proxyRequest?: ProxyRequester
  refreshToken?: string
}

export async function createApp(options: CreateAppOptions = {}) {
  const content = options.content ?? await createContentStoreFromEnv()
  const allowHosts = options.proxyAllowHosts ?? parseAllowHosts(process.env.DOUBLE_PROXY_ALLOW_HOSTS)
  const refreshToken = options.refreshToken ?? process.env.CONTENT_REFRESH_TOKEN?.trim() ?? ''
  const payment = createBsvPaymentMiddleware({
    getArticle: slug => content.getArticle(slug),
    makeWallet: options.makeWallet
  })

  const app = express()
  app.disable('x-powered-by')
  app.use(cors({
    exposedHeaders: ['x-bsv-sats', 'x-bsv-server']
  }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/', (_req, res) => {
    pageHeaders(res)
    const cards = content.getAllArticles().map(article => articleCard(article)).join('')
    res.send(pageShell('The NOW\u2122 Times', cards))
  })

  app.get('/double', (_req, res) => {
    res.set('Cache-Control', 'private, no-store')
    res.set('X-Content-Type-Options', 'nosniff')
    res.send(doublePageHtml())
  })

  app.post('/double/proxy', express.raw({ type: '*/*', limit: '2mb' }), async (req, res) => {
    try {
      const rawUrl = typeof req.query.url === 'string' ? req.query.url : ''
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0)
      const result = await forwardAllowedPost({
        rawUrl,
        body,
        allowHosts,
        lookup: options.proxyLookup,
        request: options.proxyRequest
      })
      res.status(result.status).type('text/plain').send(result.body)
    } catch (error) {
      if (error instanceof ProxyError) {
        const status = error.status === 400 || error.status === 403 || error.status === 413 ? error.status : 502
        res.status(status).json({ error: error.message })
        return
      }
      res.status(502).json({ error: 'upstream request failed' })
    }
  })

  app.post('/content/refresh', async (_req, res) => {
    if (!refreshToken) {
      res.status(404).end()
      return
    }
    const header = _req.get('authorization') ?? ''
    const presented = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
    if (!safeEqual(presented, refreshToken)) {
      res.status(401).end()
      return
    }
    const result = await content.refresh({ force: true })
    if (result.kind === 'failed') {
      res.status(502).json({ status: 'failed' })
      return
    }
    res.json({
      status: result.kind,
      articles: content.getAllArticles().length,
      commit: result.commit ?? null
    })
  })

  app.get('/.well-known/bsv-identity', (_req, res) => {
    const key = payment.getIdentityKey()
    res.json({ identityKey: key || 'not-initialized' })
  })

  app.get('/images/:name', (req, res) => {
    const image = content.getImage(req.params.name)
    if (!image) {
      res.status(404).end()
      return
    }
    res.set('X-Content-Type-Options', 'nosniff')
    res.set('Cache-Control', 'public, max-age=60')
    res.type(image.contentType).send(image.body)
  })

  app.get('/articles/:slug', (req, res, next) => {
    pageHeaders(res)
    next()
  }, payment.handler, (req, res) => {
    const article = content.getArticle(req.params.slug)
    if (!article) {
      res.status(404).send(pageShell('Not Found', '<p style="text-align:center;padding:60px 0;color:#888;">Article not found.</p>'))
      return
    }
    res.send(pageShell(escapeHtml(article.title), articleBody(article), safeBase(req)))
  })

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error)
    if (res.headersSent) return
    res.status(500).type('text/plain').send('Internal Server Error')
  })

  return { app, content }
}

export async function createContentStoreFromEnv(env: NodeJS.ProcessEnv = process.env): Promise<ContentStore> {
  const source = parseContentSource(env.CONTENT_SOURCE)
  const store = new ContentStore({
    dir: bundledContentDir(),
    source,
    pollMs: parsePollMs(env.CONTENT_POLL_MS),
    github: source === 'github' ? githubConfigFromEnv(env) : null,
    logger: console
  })
  await store.loadInitial()
  return store
}

function pageHeaders(res: Response) {
  res.set('Cache-Control', 'private, no-store')
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('Content-Security-Policy', PAGE_CSP)
  res.set('Referrer-Policy', 'no-referrer')
}

function safeBase(req: Request): string | undefined {
  const host = req.get('host') ?? ''
  if (!/^[A-Za-z0-9.-]+(?::\d{1,5})?$/.test(host)) return undefined
  const proto = req.protocol === 'https' ? 'https' : 'http'
  return `${proto}://${host}/`
}

function safeEqual(presented: string, expected: string): boolean {
  if (!presented || !expected || presented.length > 256 || expected.length > 256) return false
  const left = Buffer.from(presented)
  const right = Buffer.from(expected)
  if (left.length !== right.length) {
    timingSafeEqual(left, left)
    return false
  }
  return timingSafeEqual(left, right)
}

function pageShell(title: string, body: string, baseUrl?: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${baseUrl ? `<base href="${escapeHtml(baseUrl)}">` : ''}
  <title>${title}</title>
  <meta name="color-scheme" content="light dark">
  <style>
    :root {
      --bg: #f5f5f0;
      --text: #1a1a1a;
      --text-secondary: #555;
      --text-muted: #888;
      --border: #e0ddd5;
      --badge-bg: #f0ede5;
      --badge-text: #7a6f5e;
      --lead: #333;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1a1a;
        --text: #e8e6e1;
        --text-secondary: #aaa;
        --text-muted: #777;
        --border: #333;
        --badge-bg: #2a2a28;
        --badge-text: #a89f8e;
        --lead: #ccc;
      }
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Georgia', 'Times New Roman', serif; background: var(--bg); color: var(--text); line-height: 1.7; padding-top: 64px; }
    a { color: inherit; }
    .container { max-width: 680px; margin: 0 auto; padding: 0 16px; }
    .site-header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: var(--bg); border-bottom: 1px solid var(--border); padding: 10px 16px; display: flex; align-items: baseline; gap: 10px; }
    .site-title { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; }
    .site-title a { text-decoration: none; }
    .site-subtitle { font-size: 0.7rem; color: var(--text-muted); font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="site-title"><a href="/">The NOW&trade; Times</a></div>
    <div class="site-subtitle">Paid &micro;icro-parody</div>
  </header>
  <div class="container">
    ${body}
  </div>
</body>
</html>`
}

function articleCard(article: Omit<Article, 'content'>) {
  const date = new Date(article.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `
    <article style="margin-bottom: 36px; padding-bottom: 36px; border-bottom: 1px solid var(--border);">
      <a href="/articles/${escapeHtml(article.slug)}" style="text-decoration: none; display: block;">
        <div style="width: 100%; height: 180px; border-radius: 6px; overflow: hidden; margin-bottom: 14px;">
          <img src="${escapeHtml(article.image)}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
        <h2 style="font-size: 1.6rem; line-height: 1.3; letter-spacing: -0.02em; margin-bottom: 8px;">${escapeHtml(article.title)}</h2>
        <p style="color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 12px;">${escapeHtml(article.excerpt)}</p>
        <div style="font-family: system-ui, sans-serif; font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 16px; align-items: center;">
          <span>${escapeHtml(article.author)}</span>
          <span>${date}</span>
          <span style="margin-left: auto; background: var(--badge-bg); padding: 2px 10px; border-radius: 12px; color: var(--badge-text);">${article.price} sats</span>
        </div>
      </a>
    </article>`
}

function articleBody(article: Article) {
  const date = new Date(article.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `
    <article>
      <header style="margin-bottom: 32px; padding-top: 16px;">
        <h1 style="font-size: 2.2rem; line-height: 1.2; letter-spacing: -0.03em; margin-bottom: 12px;">${escapeHtml(article.title)}</h1>
        <div style="font-family: system-ui, sans-serif; font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 16px; align-items: center;">
          <span style="font-weight: 500; color: var(--text-secondary);">${escapeHtml(article.author)}</span>
          <span>${date}</span>
        </div>
      </header>
      <div style="width: 100%; height: 320px; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <img src="${escapeHtml(article.image)}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
      </div>
      <div style="font-size: 1.15rem;">
        <style>
          article .lead { font-size: 1.3rem; color: var(--lead); line-height: 1.6; margin-bottom: 24px; }
          article h2 { font-size: 1.4rem; margin: 36px 0 12px; letter-spacing: -0.01em; }
          article p { margin-bottom: 16px; }
        </style>
        ${article.content}
      </div>
      <footer style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border); font-family: system-ui, sans-serif; font-size: 0.85rem; color: var(--text-muted);">
        Paid with BSV &middot; ${article.price} sats
      </footer>
    </article>`
}

function runningAsCli(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  return import.meta.url === pathToFileURL(path.resolve(entry)).href
}

if (runningAsCli()) {
  const { app, content } = await createApp()
  content.start()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}
