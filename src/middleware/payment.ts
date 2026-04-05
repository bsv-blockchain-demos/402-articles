import { Request, Response, NextFunction } from 'express'
import { createPaymentMiddleware, send402 } from '@bsv/402-pay/server'
import { makeWallet } from '../wallet.js'
import { getArticle } from '../articles.js'

declare global {
  namespace Express {
    interface Request {
      payment?: {
        accepted: boolean
        satoshisPaid: number
      }
    }
  }
}

let cachedIdentityKey = ''

async function getIdentityKey(): Promise<string> {
  if (!cachedIdentityKey) {
    const { identityKey } = await makeWallet()
    cachedIdentityKey = identityKey
  }
  return cachedIdentityKey
}

export function getServerIdentityKey() {
  return cachedIdentityKey
}

export function createBsvPaymentMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { wallet } = await makeWallet()
    const identityKey = await getIdentityKey()

    const slug = req.path.replace('/articles/', '')
    const article = getArticle(slug)
    const price = article?.price ?? 100

    const middleware = createPaymentMiddleware({
      wallet,
      calculatePrice: () => price
    })

    await middleware(req, res, next)
  }
}
