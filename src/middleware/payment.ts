import { RequestHandler } from 'express'
import { createPaymentMiddleware } from '@bsv/402-pay/server'
import { getWallet, makeWallet as defaultMakeWallet, ServerWallet } from '../wallet.js'
import type { Article } from '../content/types.js'

export function slugFromArticlePath(requestPath: string): string {
  const match = requestPath.match(/\/articles\/([^/]+)\/?$/)
  if (!match) return ''
  try {
    return decodeURIComponent(match[1])
  } catch {
    return ''
  }
}

export function createBsvPaymentMiddleware(deps: {
  getArticle: (slug: string) => Article | undefined
  makeWallet?: () => Promise<ServerWallet>
}): { handler: RequestHandler; getIdentityKey: () => string } {
  const makeWallet = deps.makeWallet ?? defaultMakeWallet
  let identityKey = ''
  let pending: Promise<RequestHandler> | null = null

  const middleware = (): Promise<RequestHandler> => {
    if (!pending) {
      pending = makeWallet().then(({ wallet, identityKey: key }) => {
        identityKey = key || identityKey
        return createPaymentMiddleware({
          wallet,
          calculatePrice: (requestPath: string) => {
            const slug = slugFromArticlePath(requestPath)
            if (!slug) return undefined
            return deps.getArticle(slug)?.price
          }
        })
      }).catch(error => {
        pending = null
        throw error
      })
    }
    return pending
  }

  return {
    getIdentityKey: () => identityKey || getWallet()?.identityKey || '',
    handler: async (req, res, next) => {
      try {
        const payment = await middleware()
        await payment(req, res, next)
      } catch (error) {
        next(error)
      }
    }
  }
}
