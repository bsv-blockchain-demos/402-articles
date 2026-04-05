# The NOW™ Times

A paywalled micro-parody publication powered by BSV 402 micropayments.

## Quick Start with Docker Compose

### 1. Create your `.env` file

```sh
cp .env.example .env
```

Edit `.env` and set your BSV private key:

```
PRIVATE_KEY=your_64_character_hex_private_key_here
CHAIN=main
STORAGE_URL=https://store-us-1.bsvb.tech
```

`PRIVATE_KEY` is the only required variable. Generate one with:

```sh
openssl rand -hex 32
```

### 2. Start the service

```sh
docker compose up -d
```

The site is now running at [http://localhost:3000](http://localhost:3000).

### 3. View logs

```sh
docker compose logs -f article
```

### 4. Stop

```sh
docker compose down
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PRIVATE_KEY` | Yes | - | Hex-encoded BSV private key for receiving payments |
| `CHAIN` | No | `main` | Network: `main` or `test` |
| `STORAGE_URL` | No | `https://store-us-1.bsvb.tech` | Wallet storage provider |

## How It Works

- `GET /` -- Article index (free)
- `GET /articles/:slug` -- Protected article content
  - No payment headers: returns `402` with `x-bsv-sats` and `x-bsv-server`
  - Valid payment headers: validates the transaction, internalizes payment, serves content

Payment handling is powered by [`@bsv/402-pay`](https://www.npmjs.com/package/@bsv/402-pay).

### Payment Header Protocol

| Header | Direction | Description |
|---|---|---|
| `x-bsv-sats` | Server → Client | Required satoshi amount |
| `x-bsv-server` | Server → Client | Server identity public key |
| `x-bsv-beef` | Client → Server | Base64-encoded BEEF transaction |
| `x-bsv-sender` | Client → Server | Client identity public key |
| `x-bsv-nonce` | Client → Server | Random base64 derivation prefix |
| `x-bsv-time` | Client → Server | Unix ms timestamp (freshness, 30s window) |
| `x-bsv-vout` | Client → Server | Output index (decimal string) |

### Using `@bsv/402-pay` in your own server

```ts
import { createPaymentMiddleware } from '@bsv/402-pay/server'

app.get('/articles/:slug', createPaymentMiddleware({
  wallet,
  calculatePrice: (path) => getArticle(path.replace('/articles/', ''))?.price ?? 100
}), handler)
```

### Using `@bsv/402-pay` in your own client

```ts
import { create402Fetch } from '@bsv/402-pay/client'

const fetch402 = create402Fetch({ wallet })
const res = await fetch402('https://example.com/articles/foo')
const html = await res.text()
```

## Local Development

```sh
npm install
cp .env.example .env   # then set PRIVATE_KEY
npm run dev             # runs with tsx
```

## Production Deployment

See [docs/deployment.md](docs/deployment.md) for the full deployment guide, including reverse proxy setup and CI/CD details.

## CI/CD

Pushing to `main` or tagging `v*` triggers the GitHub Actions workflow which builds and publishes the Docker image to `ghcr.io/sirdeggen/article`.
