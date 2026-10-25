# The NOW Times

A demonstration publication that charges BSV micropayments for individual parody articles through HTTP `402 Payment Required` responses. It uses Express, TypeScript and `@bsv/402-pay`.

The free index lists articles and their prices. Payment handling is applied to article routes and uses one server-held wallet to receive and internalise payments.

## Requirements

- Node.js 22 and npm.
- A hexadecimal server wallet key and a compatible wallet storage provider.
- A payment-aware browser or client with a BSV wallet for paid requests.

## Run locally

```sh
npm ci
cp .env.example .env
npm test
npm run dev
```

Open `http://localhost:3000`. The port is fixed at 3000.

Set `.env` before starting. `npm run dev` loads articles from `content/` and, unless `CONTENT_SOURCE=local`, refreshes them from git.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PRIVATE_KEY` | Yes | | Hex private key for the receiving wallet. |
| `CHAIN` | No | `test` in code, `main` in Compose | `main` or `test`. Match the payment client and storage provider. |
| `STORAGE_URL` | No | `https://store-us-1.bsvb.tech` | Wallet storage URL. |
| `CONTENT_REPO` | No | `bsv-blockchain-demos/402-articles` | `owner/repo` or a GitHub URL whose content is published. |
| `CONTENT_BRANCH` | No | `main` | Branch to poll. |
| `CONTENT_PATH` | No | `content` | Directory inside that repo. |
| `CONTENT_POLL_MS` | No | `180000` | Poll interval. `0` disables polling. Values below 15 seconds are raised to 15 seconds. |
| `CONTENT_SOURCE` | No | `github` | `github` polls the repo. `local` re-reads the image's `content/` directory instead. |
| `CONTENT_GITHUB_TOKEN` | No | | Optional token. A public repo at the default interval stays inside the unauthenticated rate limit for one replica. Set this for a private repo, more replicas, or a faster poll. Contents read is enough. |
| `CONTENT_REFRESH_TOKEN` | No | | When set, `POST /content/refresh` with `Authorization: Bearer <token>` fetches immediately. The route is not registered otherwise. |
| `DOUBLE_PROXY_ALLOW_HOSTS` | No | empty (proxy disabled) | Comma-separated HTTPS hosts for `/double/proxy`, for example `node-a.example,node-b.example:8443`. |

The wallet code defaults to **testnet** when `CHAIN` is unset, while Compose defaults to **mainnet**. Set `CHAIN` explicitly.

`@bsv/sdk` is pinned to 2.1.3, the same version `@bsv/wallet-toolbox` uses, so the process loads one SDK and `npm run build` typechecks.

## Publish an article

New stories do not need a new Docker image. The running server keeps `content/` in memory, polls git with conditional requests, and falls back to the copy baked into the image if a fetch fails.

1. Add `content/<slug>.md`. The slug is the filename: lowercase letters, numbers, and hyphens.
2. Add the picture at `content/images/<file>` and set `image` to `/images/<file>`. PNG, JPEG, GIF, and WebP are accepted. The bytes are sniffed, so a JPEG named `.png` still renders.
3. Merge that commit to `main`, or whichever branch `CONTENT_BRANCH` names.
4. Wait for the poll, or notify a deployment that has `CONTENT_REFRESH_TOKEN` set:

```sh
curl -X POST -H "Authorization: Bearer $CONTENT_REFRESH_TOKEN" https://now.bsvblockchain.tech/content/refresh
```

`GET /` lists the new article. `GET /articles/<slug>` returns `402` with `x-bsv-sats` set to the front-matter `price`. Removing the file unpublishes it on the next successful refresh. If the remote directory has no articles, or none of them parse, the server keeps the last good set.

For a local preview before pushing, set `CONTENT_SOURCE=local`. The process re-reads `content/` on the poll interval and on the refresh route.

```yaml
---
title: "Headline"
excerpt: "One sentence for the index."
author: "Deigan Cullenskink"
date: "2026-04-20"
price: 100
image: /images/photo.png
---

Opening paragraph. Markdown and HTML both work.

## A section
```

`price` is an integer number of satoshis. `date` is `YYYY-MM-DD`. Rendered HTML is sanitized: scripts, iframes, event handlers, and `javascript:` URLs are removed. A paragraph may use `class="lead"`.

## Payment flow

| Route | Behaviour |
| --- | --- |
| `GET /` | Free article index. |
| `GET /articles/:slug` | `402` with the Markdown price, then the article after payment. Unknown slugs are `404` and are not priced. |
| `GET /images/:name` | Article image from the current content set. |
| `GET /.well-known/bsv-identity` | Server identity after the wallet has been used, otherwise `not-initialized`. |
| `GET /double` | Teranode double-spend broadcast page. |
| `POST /double/proxy?url=` | Forwards the raw transaction only to an allowlisted HTTPS host. |
| `POST /content/refresh` | Authenticated content reload. Absent unless `CONTENT_REFRESH_TOKEN` is set. |

The payment middleware advertises the price and server identity in `x-bsv-sats` and `x-bsv-server`. The wallet is created once per process, on the first paid request, and reused. A compatible client pays and retries. Paid requests can spend real BSV.

`/double` builds one funded transaction in the browser and posts the original and a malleated twin at two Teranode propagation URLs. The proxy exists so the browser can reach those nodes. It is disabled until `DOUBLE_PROXY_ALLOW_HOSTS` is set. Hosts must be HTTPS. The server resolves DNS and refuses loopback, private, link-local, and metadata addresses, and it does not follow redirects.

## Build

```sh
npm test
npm run build
npm start
```

The Docker image copies `dist/` and `content/`. Static hosting is limited to the image route above; the repository root is not served.

- [content/](content/): articles and images.
- [src/middleware/payment.ts](src/middleware/payment.ts): payment-library integration.
- [src/wallet.ts](src/wallet.ts): receiving wallet.
- [docs/deployment.md](docs/deployment.md): deployment notes.

## Licence

**Declared licence: ISC.** See [package.json](package.json). No standalone licence file is included in this repository.
