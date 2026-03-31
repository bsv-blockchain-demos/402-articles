import { Request, Response, NextFunction } from 'express'
import { WalletInterface } from '@bsv/sdk'
import { makeWallet } from '../wallet.js'

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

const BRC29_PROTOCOL = [2, '3241645161d8'] as const
const PAYMENT_HEADER_PREFIX = 'x-bsv-'

console.log('✅ BSV Payment Middleware LOADED with strict header checking')

let wallet: WalletInterface

async function initWallet() {
  if (!wallet) {
    wallet = await makeWallet()
  }
  return wallet
}

export function createBsvPaymentMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Initialize wallet on first request
    if (!wallet) {
      await initWallet()
    }

    const isArticleRoute = req.path.startsWith('/articles/')
    
    // Free routes
    if (!isArticleRoute && req.path !== '/articles') {
      return next()
    }

    const hasPaymentHeader = req.headers[`${PAYMENT_HEADER_PREFIX}beef`]
    
    if (!hasPaymentHeader) {
      // Return 402 with ONLY the two headers specified (no body)
      const identityResult = await wallet.getPublicKey({ identityKey: true })
      const serverIdentityKey = typeof identityResult === 'string' ? identityResult : identityResult.publicKey || identityResult
      
      console.log('Returning 402 with payment headers for:', req.path)
      res.set({
        [`${PAYMENT_HEADER_PREFIX}sats`]: '100',
        [`${PAYMENT_HEADER_PREFIX}server`]: serverIdentityKey
      })
      
      return res.status(402).end() // No body as requested
    }

    // Has payment headers - STRICT validation (all 5 headers required)
    try {
      const sender = req.headers[`${PAYMENT_HEADER_PREFIX}sender`] as string
      const beef = req.headers[`${PAYMENT_HEADER_PREFIX}beef`] as string
      const prefix = req.headers[`${PAYMENT_HEADER_PREFIX}prefix`] as string
      const suffix = req.headers[`${PAYMENT_HEADER_PREFIX}suffix`] as string
      const outpoint = req.headers[`${PAYMENT_HEADER_PREFIX}outpoint`] as string

      // Check for presence of ALL required headers
      if (!sender || !beef || !prefix || !suffix || !outpoint) {
        return res.status(400).json({ 
          error: 'Missing required payment headers',
          required: ['sender', 'beef', 'prefix', 'suffix', 'outpoint']
        })
      }

      // Parse outpoint in format <txid>.<vout>
      const [txid, voutStr] = outpoint.split('.')
      const vout = parseInt(voutStr)
      if (!txid || isNaN(vout)) {
        return res.status(400).json({ error: 'Invalid outpoint format, expected txid.vout' })
      }
      
      // Internalize the payment transaction
      await wallet.internalizeAction({
        tx: Buffer.from(beef, 'base64'),
        outputs: [{
          outputIndex: vout,
          protocol: 'wallet payment',
          paymentRemittance: {
            derivationPrefix: prefix,
            derivationSuffix: suffix,
            senderIdentityKey: sender
          }
        }],
        description: `Payment for ${req.path}`
      })

      console.log(`Payment accepted for ${req.path} from ${sender}`)
      req.payment = { accepted: true, satoshisPaid: 100 }
      
      next()
    } catch (error) {
      console.error('Payment validation failed:', error)
      res.status(400).json({ 
        error: 'Invalid payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}