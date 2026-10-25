import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { forwardAllowedPost, isBlockedIp, parseAllowHosts, ProxyError, type PinnedRequest } from '../src/proxy.js'

const allow = ['teranode.example', 'node.example:8443']

describe('double proxy allowlist', () => {
  it('parses host and host:port entries onto https ports', () => {
    assert.deepEqual(parseAllowHosts(' Teranode.Example, node.example:8443 , http://nope.example '), [
      'teranode.example:443',
      'node.example:8443'
    ])
    assert.deepEqual(parseAllowHosts(undefined), [])
  })

  it('forwards only allowlisted public https targets and pins the resolved address', async () => {
    let lookedUp = 0
    let requested: PinnedRequest | undefined
    const result = await forwardAllowedPost({
      rawUrl: 'https://teranode.example/api/v1/tx?x=1',
      body: Buffer.from('raw-tx'),
      allowHosts: parseAllowHosts(allow.join(',')),
      lookup: async hostname => {
        lookedUp++
        assert.equal(hostname, 'teranode.example')
        return [{ address: '93.184.216.34', family: 4 }]
      },
      request: async input => {
        requested = input
        return { status: 201, body: 'accepted' }
      }
    })
    assert.equal(result.status, 201)
    assert.equal(lookedUp, 1)
    assert.equal(requested?.ip, '93.184.216.34')
    assert.equal(requested?.path, '/api/v1/tx?x=1')
    assert.equal(requested?.body.toString(), 'raw-tx')
    assert.equal(requested?.port, 443)
  })

  it('rejects missing allowlists, other hosts, private targets, and redirects before connecting', async () => {
    const denied: string[] = []
    const attempt = async (rawUrl: string, allowHosts: string[], lookupResult?: { address: string; family: number }[]) => {
      let requested = false
      let lookedUp = false
      try {
        await forwardAllowedPost({
          rawUrl,
          body: Buffer.alloc(0),
          allowHosts,
          lookup: async () => {
            lookedUp = true
            return lookupResult ?? [{ address: '93.184.216.34', family: 4 }]
          },
          request: async () => {
            requested = true
            return { status: 200, body: 'nope' }
          }
        })
        denied.push(`allowed ${rawUrl}`)
      } catch (error) {
        assert.ok(error instanceof ProxyError)
        assert.equal(requested, false)
        return { status: error.status, message: error.message, lookedUp }
      }
      return { status: 0, message: '', lookedUp }
    }

    const hosts = parseAllowHosts('teranode.example, node.example:8443')
    const disabled = await attempt('https://teranode.example/api/v1/tx', [])
    assert.equal(disabled.status, 403)
    assert.match(disabled.message, /disabled/)
    assert.equal(disabled.lookedUp, false)

    const otherHost = await attempt('https://evil.example/api/v1/tx', hosts)
    assert.equal(otherHost.status, 403)
    assert.equal(otherHost.lookedUp, false)

    const suffix = await attempt('https://teranode.example.evil.com/api/v1/tx', hosts)
    assert.equal(suffix.status, 403)

    const http = await attempt('http://teranode.example/api/v1/tx', hosts)
    assert.equal(http.status, 403)
    assert.match(http.message, /https/)

    const credentials = await attempt('https://user:pass@teranode.example/api/v1/tx', hosts)
    assert.equal(credentials.status, 403)

    const wrongPort = await attempt('https://teranode.example:444/api/v1/tx', hosts)
    assert.equal(wrongPort.status, 403)
    assert.equal(wrongPort.lookedUp, false)

    const metadata = await attempt('https://169.254.169.254/latest/meta-data', parseAllowHosts('169.254.169.254'))
    assert.equal(metadata.status, 403)
    assert.equal(metadata.lookedUp, false)

    const decimalLoopback = await attempt('https://2130706433/', parseAllowHosts('127.0.0.1'))
    assert.equal(decimalLoopback.status, 403)

    const rebinding = await attempt('https://teranode.example/api/v1/tx', hosts, [{ address: '169.254.169.254', family: 4 }])
    assert.equal(rebinding.status, 403)
    assert.equal(rebinding.lookedUp, true)

    const internalName = await attempt('https://metadata.google.internal/', parseAllowHosts('metadata.google.internal'))
    assert.equal(internalName.status, 403)

    let requested = false
    await assert.rejects(
      forwardAllowedPost({
        rawUrl: 'https://node.example:8443/api/v1/tx',
        body: Buffer.alloc(0),
        allowHosts: hosts,
        lookup: async () => [{ address: '93.184.216.34', family: 4 }],
        request: async () => {
          requested = true
          return { status: 302, body: '' }
        }
      }),
      (error: unknown) => error instanceof ProxyError && /redirect/.test(error.message)
    )
    assert.equal(requested, true)
    assert.equal(isBlockedIp('10.1.2.3'), true)
    assert.equal(isBlockedIp('8.8.8.8'), false)
    assert.equal(isBlockedIp('::ffff:127.0.0.1'), true)
  })
})
