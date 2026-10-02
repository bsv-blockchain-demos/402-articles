# The NOW Times

A demonstration publication that charges BSV micropayments for individual parody articles through HTTP `402 Payment Required` responses. It uses Express, TypeScript and `@bsv/402-pay`.

The free index lists articles and their prices. Payment handling is applied to article routes and uses a server-held wallet to receive and internalise payments.

## Requirements

- Node.js 22 and npm.
- A hexadecimal server wallet key and a compatible wallet storage provider.
- A payment-aware browser or client with a BSV wallet for paid requests.

The current production build has an SDK type mismatch, described below. Development uses `tsx`, which does not perform the same TypeScript build check.

## Run locally

```sh
npm ci
cp .env.example .env
```

Set `.env` explicitly before starting:

| Variable | Purpose |
| --- | --- |
| `PRIVATE_KEY` | Required private key for the receiving wallet. |
| `CHAIN` | `main` or `test`; choose the network used by the payment client and storage provider. |
| `STORAGE_URL` | Wallet storage URL; defaults to `https://store-us-1.bsvb.tech`. |

The wallet code defaults to **testnet**, while Compose defaults to **mainnet**. An explicit `CHAIN` avoids different behaviour between those launch methods.

```sh
npm run dev
```

Open `http://localhost:3000`. The port is fixed in `src/server.ts`. Wallet initialisation is deferred until the payment path is used, so successfully loading the index does not verify payment readiness.

## Payment flow

| Route | Behaviour |
| --- | --- |
| `GET /` | Free article index. |
| `GET /articles/:slug` | Payment middleware followed by article content. |
| `GET /.well-known/bsv-identity` | Cached server identity, or `not-initialized` before wallet initialisation. |
| `GET /double` | Additional demonstration page. |
| `POST /double/proxy` | Forwards a request to a caller-supplied HTTP(S) destination. |

The payment middleware advertises the required satoshis and server identity in `x-bsv-sats` and `x-bsv-server`. A compatible client constructs a wallet payment and retries with the payment headers.

The installed package exports `create402Fetch` from `@bsv/402-pay/client` for that client flow. The separate [src/bsv-browser.ts](src/bsv-browser.ts) helper still contains placeholder payment data and is not a working substitute. Ordinary article navigation does not itself construct a wallet payment.

Paid requests can spend real BSV. This example does not implement a publication account or subscription system.

## Deployment limitations

Static-file serving currently exposes the application root, including article source files. Restrict static serving to intended public assets before using the paywall to protect exclusive content.

The `/double/proxy` route accepts arbitrary HTTP(S) destinations without a host allowlist. Restrict or remove that auxiliary route before exposing the server publicly.

## Build status

```sh
npm run build
```

The build currently fails in `src/wallet.ts`: the top-level SDK's `KeyDeriver` is incompatible with the SDK types bundled under `@bsv/wallet-toolbox`. Align those dependency types before using `npm start` or building the Docker image.

The Dockerfile runs the same TypeScript build. Once the issue is resolved, Compose serves port 3000 and reads `.env`. No lint or automated test scripts are defined.

- [src/articles.ts](src/articles.ts): article content and prices.
- [src/middleware/payment.ts](src/middleware/payment.ts): payment-library integration.
- [src/wallet.ts](src/wallet.ts): receiving wallet configuration.
- [docs/deployment.md](docs/deployment.md): additional deployment notes; review alongside the current limitations above.

## Licence

**Declared licence: ISC.** See [package.json](package.json). No standalone licence file is included in this repository.
