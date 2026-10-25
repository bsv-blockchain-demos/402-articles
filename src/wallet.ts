import { PrivateKey, KeyDeriver, WalletInterface } from '@bsv/sdk'
import { Wallet, WalletStorageManager, WalletSigner, Services, StorageClient } from '@bsv/wallet-toolbox'
import dotenv from 'dotenv'

dotenv.config()

const CHAIN = (process.env.CHAIN as 'test' | 'main') || 'test'
const STORAGE_URL = process.env.STORAGE_URL || 'https://store-us-1.bsvb.tech'
const PRIVATE_KEY = process.env.PRIVATE_KEY!

export interface ServerWallet {
  wallet: WalletInterface
  identityKey: string
}

let walletInstance: ServerWallet | null = null
let walletPromise: Promise<ServerWallet> | null = null

export function makeWallet(): Promise<ServerWallet> {
  if (!walletPromise) {
    walletPromise = initWallet().then(wallet => {
      walletInstance = wallet
      return wallet
    }).catch(error => {
      walletPromise = null
      throw error
    })
  }
  return walletPromise
}

export function getWallet(): ServerWallet | null {
  return walletInstance
}

async function initWallet(): Promise<ServerWallet> {
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required')
  }

  console.log(`Initializing ${CHAIN} wallet...`)

  const keyDeriver = new KeyDeriver(new PrivateKey(PRIVATE_KEY, 'hex'))
  const storageManager = new WalletStorageManager(keyDeriver.identityKey)
  const signer = new WalletSigner(CHAIN, keyDeriver, storageManager)
  const services = new Services(CHAIN)
  const wallet = new Wallet(signer, services)
  const client = new StorageClient(wallet, STORAGE_URL)

  await client.makeAvailable()
  await storageManager.addWalletStorageProvider(client)

  console.log('Wallet initialized. Identity key:', keyDeriver.identityKey)
  return { wallet, identityKey: keyDeriver.identityKey }
}
