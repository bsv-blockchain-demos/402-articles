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
    const nonce = 'cGF5bWVudC1wcmVmaXg='
    const time = String(Date.now())
    const beefB64 = 'beefdata'
    const vout = '0'
    const newHeaders = {
      [`${PAYMENT_HEADER_PREFIX}beef`]: beefB64,
      [`${PAYMENT_HEADER_PREFIX}sender`]: publicKey,
      [`${PAYMENT_HEADER_PREFIX}nonce`]: nonce,
      [`${PAYMENT_HEADER_PREFIX}time`]: time,
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
