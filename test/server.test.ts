import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, before, describe, it } from 'node:test'
import type { Express } from 'express'
import { ContentStore } from '../src/content/index.js'
import { createApp } from '../src/server.js'
import type { ServerWallet } from '../src/wallet.js'

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
const silent = { info() {}, warn() {} }

function fakeWallet() {
  let calls = 0
  const makeWallet = async (): Promise<ServerWallet> => ({
    identityKey: 'server-identity',
    wallet: {
      getPublicKey: async () => {
        calls += 1
        return { publicKey: '02' + 'ab'.repeat(32) }
      }
    } as unknown as ServerWallet['wallet']
  })
  return { makeWallet, calls: () => calls }
}

async function listen(app: Express): Promise<{ server: Server; url: string }> {
  const server = await new Promise<Server>(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening))
  })
  const address = server.address() as AddressInfo
  return { server, url: `http://127.0.0.1:${address.port}` }
}

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

describe('article server', () => {
  const wallet = fakeWallet()
  let server: Server
  let url = ''

  before(async () => {
    const { app } = await createApp({ makeWallet: wallet.makeWallet, proxyAllowHosts: [] })
    const listening = await listen(app)
    server = listening.server
    url = listening.url
  })

  after(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  })

  it('lists bundled articles without the paid body and prices 402s from front matter', async () => {
    const home = await fetch(url + '/')
    const html = await home.text()
    assert.equal(home.status, 200)
    assert.match(home.headers.get('content-security-policy') ?? '', /script-src 'none'/)
    assert.match(html, /The NOW/)
    assert.equal(html.includes('agentic psychosis'), false)
    assert.match(html, /Judges now reviewing 1.5 million transactions/)
    assert.deepEqual([...html.matchAll(/\/articles\/([a-z0-9-]+)/g)].map(match => match[1]), [
      'agentpay-hackathon',
      'chronicle-activates',
      'tetheral-reserve-bank',
      'runar-playground'
    ])
    const beforePay = await fetch(url + '/.well-known/bsv-identity')
    assert.equal((await beforePay.json()).identityKey, 'not-initialized')

    const prices: Record<string, string> = {
      'agentpay-hackathon': '150',
      'chronicle-activates': '100',
      'runar-playground': '75',
      'tetheral-reserve-bank': '200'
    }
    for (const [slug, price] of Object.entries(prices)) {
      const response = await fetch(`${url}/articles/${slug}`)
      assert.equal(response.status, 402)
      assert.equal(response.headers.get('x-bsv-sats'), price)
      assert.equal(response.headers.get('x-bsv-server'), '02' + 'ab'.repeat(32))
      assert.equal(await response.text(), '')
    }
    assert.equal(wallet.calls(), 1)

    const identity = await fetch(url + '/.well-known/bsv-identity')
    assert.equal((await identity.json()).identityKey, 'server-identity')

    const missing = await fetch(url + '/articles/not-a-story')
    assert.equal(missing.status, 404)
    assert.equal(missing.headers.get('x-bsv-sats'), null)

    const png = await fetch(url + '/images/g5.png')
    assert.equal(png.status, 200)
    assert.equal(png.headers.get('content-type'), 'image/png')
    assert.equal(png.headers.get('x-content-type-options'), 'nosniff')
    const bytes = Buffer.from(await png.arrayBuffer())
    assert.equal(bytes.subarray(0, 4).toString('hex'), '89504e47')

    const jpegNamedPng = await fetch(url + '/images/g2.png')
    assert.equal(jpegNamedPng.status, 200)
    assert.equal(jpegNamedPng.headers.get('content-type'), 'image/jpeg')

    const tool = await fetch(url + '/double')
    assert.match(await tool.text(), /DOUBLE_PROXY_ALLOW_HOSTS/)
    const proxy = await fetch(url + '/double/proxy?url=' + encodeURIComponent('https://evil.example/api/v1/tx'), { method: 'POST' })
    assert.equal(proxy.status, 403)
    const refresh = await fetch(url + '/content/refresh', { method: 'POST' })
    assert.equal(refresh.status, 404)
  })
})

describe('publishing without a restart', () => {
  it('shows a new Markdown article and its front-matter price after refresh', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'now-times-pub-'))
    const wallet = fakeWallet()
    let server: Server | undefined
    try {
      await mkdir(path.join(dir, 'images'))
      await writeFile(path.join(dir, 'images', 'pic.png'), PNG)
      await writeFile(path.join(dir, 'kept-story.md'), article({ title: 'Kept', price: 4, date: '2026-01-01' }, '<p>Kept</p>'))
      const content = new ContentStore({ dir, source: 'local', pollMs: 0, logger: silent })
      await content.loadInitial()
      let requested = false
      const { app } = await createApp({
        content,
        makeWallet: wallet.makeWallet,
        refreshToken: 'refresh-secret',
        proxyAllowHosts: ['teranode.example'],
        proxyLookup: async () => [{ address: '93.184.216.34', family: 4 }],
        proxyRequest: async () => {
          requested = true
          return { status: 202, body: 'broadcast' }
        }
      })
      const listening = await listen(app)
      server = listening.server

      const before = await fetch(listening.url + '/')
      assert.equal((await before.text()).includes('Fresh story'), false)

      await writeFile(path.join(dir, 'fresh-story.md'), article({
        title: '<script>alert(1)</script>',
        excerpt: '<img src=x onerror=alert(1)>',
        price: 33,
        date: '2026-08-01'
      }, '<p>Fresh story</p><script>alert(1)</script>'))

      const denied = await fetch(listening.url + '/content/refresh', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong' }
      })
      assert.equal(denied.status, 401)
      assert.equal((await (await fetch(listening.url + '/')).text()).includes('Fresh story'), false)

      const refreshed = await fetch(listening.url + '/content/refresh', {
        method: 'POST',
        headers: { authorization: 'Bearer refresh-secret' }
      })
      assert.equal(refreshed.status, 200)
      const body = await refreshed.json() as { status: string; articles: number }
      assert.equal(body.status, 'updated')
      assert.equal(body.articles, 2)

      const home = await fetch(listening.url + '/')
      const html = await home.text()
      assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
      assert.equal(html.includes('<script>alert'), false)
      assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
      const paid = await fetch(listening.url + '/articles/fresh-story')
      assert.equal(paid.status, 402)
      assert.equal(paid.headers.get('x-bsv-sats'), '33')
      assert.equal(wallet.calls(), 1)

      const broadcast = await fetch(listening.url + '/double/proxy?url=' + encodeURIComponent('https://teranode.example/api/v1/tx'), {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream' },
        body: Buffer.from([1, 2, 3, 4])
      })
      assert.equal(broadcast.status, 202)
      assert.equal(await broadcast.text(), 'broadcast')
      assert.equal(requested, true)

      const blocked = await fetch(listening.url + '/double/proxy?url=' + encodeURIComponent('http://127.0.0.1/'), { method: 'POST' })
      assert.equal(blocked.status, 403)
    } finally {
      if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()))
      await rm(dir, { recursive: true, force: true })
    }
  })
})
