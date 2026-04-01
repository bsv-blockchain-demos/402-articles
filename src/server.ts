import express from 'express'
import path from 'path'
import cors from 'cors'
import { createBsvPaymentMiddleware, getServerIdentityKey } from './middleware/payment.js'
import { getAllArticles, getArticle, Article } from './articles.js'

const app = express()
const PORT = 3000

app.use(cors({
  exposedHeaders: ['x-bsv-sats', 'x-bsv-server']
}))
app.use(express.json())
app.use(express.static(path.join(import.meta.dirname, '..')))

const paymentMiddleware = createBsvPaymentMiddleware()

function pageShell(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
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

function articleCard(a: Omit<Article, 'content'>) {
  return `
    <article style="margin-bottom: 36px; padding-bottom: 36px; border-bottom: 1px solid var(--border);">
      <a href="/articles/${a.slug}" style="text-decoration: none; display: block;">
        <div style="width: 100%; height: 180px; border-radius: 6px; overflow: hidden; margin-bottom: 14px;">
          <img src="${a.image}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
        <h2 style="font-size: 1.6rem; line-height: 1.3; letter-spacing: -0.02em; margin-bottom: 8px;">${a.title}</h2>
        <p style="color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 12px;">${a.excerpt}</p>
        <div style="font-family: system-ui, sans-serif; font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 16px; align-items: center;">
          <span>${a.author}</span>
          <span>${new Date(a.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span style="margin-left: auto; background: var(--badge-bg); padding: 2px 10px; border-radius: 12px; color: var(--badge-text);">${a.price} sats</span>
        </div>
      </a>
    </article>`
}

app.get('/', (req, res) => {
  const articles = getAllArticles()
  const cards = articles.map(a => articleCard(a)).join('')
  res.send(pageShell('The NOW\u2122 Times', cards))
})

app.get('/.well-known/bsv-identity', (req, res) => {
  const key = getServerIdentityKey()
  res.json({ identityKey: key || 'not-initialized' })
})

app.get('/articles/:slug', paymentMiddleware, (req, res) => {
  const article = getArticle(req.params.slug)
  if (!article) {
    return res.status(404).send(pageShell('Not Found', '<p style="text-align:center;padding:60px 0;color:#888;">Article not found.</p>'))
  }

  const body = `
    <article>
      <header style="margin-bottom: 32px; padding-top: 16px;">
        <h1 style="font-size: 2.2rem; line-height: 1.2; letter-spacing: -0.03em; margin-bottom: 12px;">${article.title}</h1>
        <div style="font-family: system-ui, sans-serif; font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 16px; align-items: center;">
          <span style="font-weight: 500; color: var(--text-secondary);">${article.author}</span>
          <span>${new Date(article.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>
      <div style="width: 100%; height: 320px; border-radius: 8px; overflow: hidden; margin-bottom: 32px;">
        <img src="${article.image}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
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

  res.send(pageShell(article.title, body))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})