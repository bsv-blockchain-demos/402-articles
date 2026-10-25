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

Open a pull request to `main`:

1. Add `content/<slug>.md`. The slug is the filename: lowercase letters, numbers, and hyphens, and it must be unique among the articles.
2. Add the picture at `content/images/<file>` and set `image` to `/images/<file>`. PNG, JPEG, GIF, and WebP are accepted. The bytes are sniffed, so a JPEG named `.png` still renders. The image file has to be in the pull request, or already on the branch.
3. Mark the pull request ready for review. Drafts are not merged automatically.

CI validates every `content/*.md`. The front matter has to parse, `price` has to be a positive integer number of satoshis, the slug has to be unique, and the image file has to exist and be a real PNG, JPEG, GIF, or WebP within the size the server will load. A broken article fails the test job.

The pull request merges itself when all of these are true:

- The author is listed in [`.github/content-merge-allowlist.txt`](.github/content-merge-allowlist.txt). The list starts with `sirdeggen`.
- The pull request is not a draft.
- Every changed file is a `content/<slug>.md` article or a PNG, JPEG, GIF, or WebP under `content/images/`. A change to code, tests, or workflows stays open for a person to review.
- The test job in [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml) passed, including the article check, and that workflow finished green.

[`.github/workflows/auto-merge-content.yml`](.github/workflows/auto-merge-content.yml) does the merge with its own `GITHUB_TOKEN`. It reads the allowlist from the default branch and does not check out the pull request. Adding a login to the allowlist changes a file outside `content/`, so that pull request needs a review.

After the commit is on the branch named by `CONTENT_BRANCH` (usually `main`), wait for the poll, or notify a deployment that has `CONTENT_REFRESH_TOKEN` set:

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

### Repository settings for automatic merge

The workflow can merge only when Actions is allowed to write.

- **Settings → Actions → General → Workflow permissions**: choose **Read and write permissions**. A repository set to read-only ignores the write permission in the workflow file, and the merge does not happen.
- **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**: turn this on when `main` requires an approving review. The workflow approves the content pull request and then merges it. Leave it off only when `main` does not require a review.
- **Allow auto-merge** can stay off. This workflow calls the merge API once the test job is green. It does not use GitHub's auto-merge queue.
- If a ruleset still rejects the token after that approval, add the GitHub Actions app to the ruleset bypass list.
- Do not make the auto-merge workflow a required status check. The required check is the test job. The auto-merge job exits successfully when it skips a pull request on purpose.

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
