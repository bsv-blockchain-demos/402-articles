import { lookup } from 'node:dns/promises'
import https from 'node:https'
import { BlockList, isIP } from 'node:net'

const RESPONSE_MAX_BYTES = 64 * 1024
const BODY_MAX_BYTES = 2 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 15_000

const blockedAddresses = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4]
] as const) {
  blockedAddresses.addSubnet(network, prefix, 'ipv4')
}
blockedAddresses.addAddress('255.255.255.255', 'ipv4')
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
  ['2001:db8::', 32]
] as const) {
  blockedAddresses.addSubnet(network, prefix, 'ipv6')
}

export class ProxyError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export interface ResolvedAddress {
  address: string
  family: number
}

export type ProxyLookup = (hostname: string) => Promise<ResolvedAddress[]>

export interface PinnedRequest {
  hostname: string
  ip: string
  family: number
  port: number
  path: string
  body: Buffer
}

export type ProxyRequester = (input: PinnedRequest) => Promise<{ status: number; body: string }>

export function parseAllowHosts(value: string | undefined): string[] {
  if (!value) return []
  const hosts: string[] = []
  for (const part of value.split(',')) {
    const normalized = normalizeAllowEntry(part)
    if (normalized) hosts.push(normalized)
  }
  return hosts
}

export async function forwardAllowedPost(args: {
  rawUrl: string
  body: Buffer
  allowHosts: readonly string[]
  lookup?: ProxyLookup
  request?: ProxyRequester
}): Promise<{ status: number; body: string }> {
  const allowHosts = parseAllowHosts(args.allowHosts.join(','))
  if (allowHosts.length === 0) throw new ProxyError('proxy is disabled', 403)
  if (args.body.length > BODY_MAX_BYTES) throw new ProxyError('body too large', 413)

  const target = validateTarget(args.rawUrl, new Set(allowHosts))
  const addresses = isIP(target.hostname)
    ? [{ address: target.hostname, family: isIP(target.hostname) }]
    : await (args.lookup ?? defaultLookup)(target.hostname)
  if (addresses.length === 0 || addresses.some(item => isBlockedIp(item.address))) {
    throw new ProxyError('host is not allowed', 403)
  }
  const chosen = addresses[0]
  const result = await (args.request ?? pinnedRequest)({
    hostname: target.hostname,
    ip: chosen.address,
    family: chosen.family,
    port: target.port,
    path: target.path,
    body: args.body
  })
  if (result.status >= 300 && result.status < 400) throw new ProxyError('redirects are not allowed', 502)
  return result
}

function validateTarget(rawUrl: string, allowHosts: Set<string>): { hostname: string; port: number; path: string } {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new ProxyError('invalid url', 400)
  }
  if (url.protocol !== 'https:') throw new ProxyError('only https targets are allowed', 403)
  if (url.username || url.password) throw new ProxyError('credentials are not allowed', 403)
  const hostname = bareHostname(url.hostname)
  if (!hostname || isBlockedHostname(hostname)) throw new ProxyError('host is not allowed', 403)
  const port = url.port ? Number(url.port) : 443
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new ProxyError('invalid url', 400)
  if (!allowHosts.has(`${hostname}:${port}`)) throw new ProxyError('host is not allowed', 403)
  if (isIP(hostname) && isBlockedIp(hostname)) throw new ProxyError('host is not allowed', 403)
  const pathAndQuery = `${url.pathname}${url.search}`
  if (!pathAndQuery.startsWith('/') || pathAndQuery.length > 2048 || pathAndQuery.includes('\0')) {
    throw new ProxyError('invalid url', 400)
  }
  return { hostname, port, path: pathAndQuery }
}

function normalizeAllowEntry(entry: string): string | null {
  const value = entry.trim().toLowerCase()
  if (!value || value.includes('://') || value.includes('/')) return null
  const match = value.match(/^([a-z0-9.-]+|\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/)
  if (!match) return null
  const port = match[2] ? Number(match[2]) : 443
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null
  return `${match[1]}:${port}`
}

function bareHostname(hostname: string): string {
  let host = hostname.toLowerCase().replace(/\.$/, '')
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1)
  return host
}

function isBlockedHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === 'metadata.google.internal' || hostname === 'metadata.goog') return true
  return ['.localhost', '.local', '.internal', '.localdomain'].some(suffix => hostname.endsWith(suffix))
}

export function isBlockedIp(ip: string): boolean {
  const canonical = canonicalIp(ip)
  if (!canonical) return true
  return blockedAddresses.check(canonical.ip, canonical.family === 4 ? 'ipv4' : 'ipv6')
}

function canonicalIp(ip: string): { ip: string; family: 4 | 6 } | null {
  const family = isIP(ip)
  if (family === 4) return { ip, family: 4 }
  if (family === 6) {
    const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
    if (mapped && isIP(mapped[1]) === 4) return { ip: mapped[1], family: 4 }
    return { ip, family: 6 }
  }
  return null
}

async function defaultLookup(hostname: string): Promise<ResolvedAddress[]> {
  const results = await lookup(hostname, { all: true, verbatim: true })
  return results.map(result => ({ address: result.address, family: result.family }))
}

function pinnedRequest(input: PinnedRequest): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const request = https.request({
      host: input.ip,
      port: input.port,
      family: input.family,
      servername: input.hostname,
      method: 'POST',
      path: input.path,
      headers: {
        Host: input.port === 443 ? input.hostname : `${input.hostname}:${input.port}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': input.body.length
      },
      timeout: REQUEST_TIMEOUT_MS,
      rejectUnauthorized: true
    }, (response) => {
      const status = response.statusCode ?? 502
      if (status >= 300 && status < 400) {
        response.resume()
        reject(new ProxyError('redirects are not allowed', 502))
        return
      }
      const chunks: Buffer[] = []
      let size = 0
      response.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > RESPONSE_MAX_BYTES) {
          request.destroy()
          reject(new ProxyError('upstream response too large', 502))
          return
        }
        chunks.push(chunk)
      })
      response.on('end', () => {
        resolve({ status, body: Buffer.concat(chunks).toString('utf8') })
      })
    })
    request.on('timeout', () => request.destroy(new Error('timeout')))
    request.on('error', () => reject(new ProxyError('upstream request failed', 502)))
    request.end(input.body)
  })
}
