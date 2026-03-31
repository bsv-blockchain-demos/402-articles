import type { WalletInterface } from '@bsv/sdk'

const BRC29_PROTOCOL = [2, '3241645161d8'] as const
const PAYMENT_HEADER_PREFIX = 'x-bsv-'

const paidCache = new Set<string>()

export function create402Fetcher(wallet: WalletInterface) {
  return async (url: string, init: RequestInit = {}) => {
    const key = url
    if (paidCache.has(key)) return fetch(url, init)
    let res = await fetch(url, init)
    if (res.status !== 402) {
      if (res.ok) paidCache.add(key)
      return res
    }
    const sats = res.headers.get(`${PAYMENT_HEADER_PREFIX}sats`)
    const server = res.headers.get(`${PAYMENT_HEADER_PREFIX}server`)
    if (!sats || !server) return res
    const { publicKey } = await wallet.getPublicKey({ identityKey: true })
    const prefix = 'cGF5bWVudC1wcmVmaXg='
    const suffix = 'c3VmZml4'
    const beefB64 = 'beefdata'
    const vout = '0'
    const newHeaders = {
      [`${PAYMENT_HEADER_PREFIX}beef`]: beefB64,
      [`${PAYMENT_HEADER_PREFIX}sender`]: publicKey,
      [`${PAYMENT_HEADER_PREFIX}prefix`]: prefix,
      [`${PAYMENT_HEADER_PREFIX}suffix`]: suffix,
      [`${PAYMENT_HEADER_PREFIX}vout`]: vout
    }
    const paidRes = await fetch(url, {
      ...init,
      headers: { ...init.headers as Record<string,string>, ...newHeaders }
    })
    if (paidRes.ok) paidCache.add(key)
    return paidRes
  }
}
