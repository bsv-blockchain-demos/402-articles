# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- A BSV wallet private key (hex-encoded, 64 characters)

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PRIVATE_KEY` | Yes | - | Hex-encoded BSV private key for the server wallet. Used to receive and validate payments. |
| `CHAIN` | No | `main` | BSV network: `main` for mainnet, `test` for testnet. |
| `STORAGE_URL` | No | `https://store-us-1.bsvb.tech` | Wallet storage provider URL. |

## Quick Start

1. Clone the repository:

```sh
git clone https://github.com/sirdeggen/article.git
cd article
```

2. Create a `.env` file with your private key:

```sh
echo "PRIVATE_KEY=your_64_char_hex_private_key_here" > .env
echo "CHAIN=main" >> .env
```

3. Start the service:

```sh
docker compose up -d
```

The server will be available at `http://localhost:3000`.

## Generating a Private Key

If you don't have a BSV private key, you can generate one:

```sh
openssl rand -hex 32
```

Use this value as `PRIVATE_KEY` in your `.env` file. This key controls the wallet that receives article payments. Back it up securely.

## Using the Published Image

Instead of building locally, you can pull the pre-built image from GitHub Container Registry:

```yaml
# In docker-compose.yml, replace build: . with:
image: ghcr.io/sirdeggen/article:latest
```

Or pull directly:

```sh
docker pull ghcr.io/sirdeggen/article:latest
```

## Building Locally

```sh
docker compose build
docker compose up -d
```

## Viewing Logs

```sh
docker compose logs -f article
```

## Stopping

```sh
docker compose down
```

## Running Behind a Reverse Proxy

For production, run behind nginx or caddy to provide TLS. Example nginx config:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Health Check

The index page serves as an implicit health check:

```sh
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# Should return 200
```

## CI/CD

The GitHub Actions workflow at `.github/workflows/docker-publish.yml` automatically builds and pushes the Docker image to `ghcr.io/sirdeggen/article` on every push to `main`/`master` or when a version tag (`v*`) is created.
