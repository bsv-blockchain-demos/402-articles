import { PrivateKey, KeyDeriver, WalletInterface } from '@bsv/sdk'
import { Wallet, WalletStorageManager, WalletSigner, Services, StorageClient } from '@bsv/wallet-toolbox'
import dotenv from 'dotenv'

dotenv.config()

const CHAIN = (process.env.CHAIN as 'test' | 'main') || 'test'
const STORAGE_URL = process.env.STORAGE_URL || 'https://store-us-1.bsvb.tech'
const PRIVATE_KEY = process.env.PRIVATE_KEY!

let walletInstance: WalletInterface | null = null

export async function makeWallet(): Promise<WalletInterface> {
  if (walletInstance) return walletInstance

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

  walletInstance = wallet
  console.log('Wallet initialized. Identity key:', keyDeriver.identityKey)
  
  return wallet
}

export function getWallet(): WalletInterface | null {
  return walletInstance
}