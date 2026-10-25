export interface GithubConfig {
  owner: string
  repo: string
  branch: string
  path: string
  token?: string
}

export interface GithubCachedFile {
  sha: string
  bytes: Buffer
}

export interface GithubSyncState {
  etag?: string
  commit?: string
  files: Map<string, GithubCachedFile>
}

export type GithubSnapshot =
  | { kind: 'not-modified' }
  | { kind: 'failed'; reason: string }
  | { kind: 'updated'; etag: string | null; commit: string; files: Map<string, GithubCachedFile> }

const MARKDOWN_MAX_BYTES = 512 * 1024
const IMAGE_MAX_BYTES = 8 * 1024 * 1024
const API = 'https://api.github.com'

export function parseGithubRepo(input: string): { owner: string; repo: string } | null {
  let value = input.trim()
  if (!value) return null
  value = value.replace(/\.git$/, '')
  value = value.replace(/^https?:\/\/github\.com\//, '')
  value = value.replace(/^git@github\.com:/, '')
  const parts = value.split('/').filter(Boolean)
  if (parts.length !== 2) return null
  const [owner, repo] = parts
  if (!isSafeName(owner) || !isSafeName(repo)) return null
  return { owner, repo }
}

export function githubConfigFromEnv(env: NodeJS.ProcessEnv = process.env): GithubConfig | null {
  const parsed = parseGithubRepo(env.CONTENT_REPO?.trim() || 'bsv-blockchain-demos/402-articles')
  if (!parsed) return null
  const branch = (env.CONTENT_BRANCH || 'main').trim() || 'main'
  const contentPath = (env.CONTENT_PATH || 'content').trim().replace(/^\/+|\/+$/g, '') || 'content'
  if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.includes('..')) return null
  if (!/^[A-Za-z0-9._/-]+$/.test(contentPath) || contentPath.includes('..')) return null
  const token = env.CONTENT_GITHUB_TOKEN?.trim() || undefined
  return { ...parsed, branch, path: contentPath, token }
}

export function parseContentSource(value: string | undefined): 'local' | 'github' {
  return value?.trim().toLowerCase() === 'local' ? 'local' : 'github'
}

export function parsePollMs(value: string | undefined): number {
  if (value == null || value.trim() === '') return 180_000
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 180_000
  if (parsed === 0) return 0
  return Math.max(15_000, Math.floor(parsed))
}

export async function fetchGithubSnapshot(
  config: GithubConfig,
  state: GithubSyncState,
  fetchImpl: typeof fetch,
  opts?: { force?: boolean }
): Promise<GithubSnapshot> {
  try {
    const commitHeaders = apiHeaders(config.token)
    if (state.etag && !opts?.force) commitHeaders['If-None-Match'] = state.etag
    const commitResponse = await fetchImpl(commitUrl(config), { headers: commitHeaders, redirect: 'error' })
    if (commitResponse.status === 304) return { kind: 'not-modified' }
    if (commitResponse.status === 403 || commitResponse.status === 429) {
      return { kind: 'failed', reason: `github rate limit (${commitResponse.status})` }
    }
    if (!commitResponse.ok) {
      return { kind: 'failed', reason: `github commit lookup failed (${commitResponse.status})` }
    }
    const commit = await readJson(commitResponse)
    const commitSha = stringField(commit, 'sha')
    const treeSha = stringField(nested(commit, 'commit', 'tree'), 'sha')
    if (!commitSha || !treeSha) return { kind: 'failed', reason: 'github commit response was incomplete' }
    const etag = commitResponse.headers.get('etag')

    const treeResponse = await fetchImpl(treeUrl(config, treeSha), {
      headers: apiHeaders(config.token),
      redirect: 'error'
    })
    if (!treeResponse.ok) return { kind: 'failed', reason: `github tree lookup failed (${treeResponse.status})` }
    const tree = await readJson(treeResponse)
    if (!tree || typeof tree !== 'object') return { kind: 'failed', reason: 'github tree response was incomplete' }
    if ((tree as { truncated?: unknown }).truncated === true) {
      return { kind: 'failed', reason: 'github tree truncated' }
    }
    const entries = Array.isArray((tree as { tree?: unknown }).tree) ? (tree as { tree: unknown[] }).tree : null
    if (!entries) return { kind: 'failed', reason: 'github tree response was incomplete' }

    const wanted = entries.flatMap(entry => {
      const file = wantedBlob(entry, config.path)
      return file ? [file] : []
    })
    const files = new Map<string, GithubCachedFile>()
    for (const file of wanted) {
      const cached = state.files.get(file.path)
      if (cached && cached.sha === file.sha) {
        files.set(file.path, cached)
        continue
      }
      const max = file.kind === 'image' ? IMAGE_MAX_BYTES : MARKDOWN_MAX_BYTES
      if (file.size != null && file.size > max) return { kind: 'failed', reason: `${file.path} is too large` }
      const blobResponse = await fetchImpl(blobUrl(config, file.sha), {
        headers: apiHeaders(config.token),
        redirect: 'error'
      })
      if (!blobResponse.ok) return { kind: 'failed', reason: `github blob lookup failed (${blobResponse.status})` }
      const blob = await readJson(blobResponse)
      const bytes = decodeBlob(blob, max)
      if (!bytes) return { kind: 'failed', reason: `github blob ${file.path} was unreadable` }
      files.set(file.path, { sha: file.sha, bytes })
    }

    return { kind: 'updated', etag, commit: commitSha, files }
  } catch (error) {
    return { kind: 'failed', reason: error instanceof Error ? error.message : 'github fetch failed' }
  }
}

function isSafeName(value: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(value)
}

function commitUrl(config: GithubConfig): string {
  return `${API}/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/commits/${encodeURIComponent(config.branch)}`
}

function treeUrl(config: GithubConfig, treeSha: string): string {
  return `${API}/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`
}

function blobUrl(config: GithubConfig, sha: string): string {
  return `${API}/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/git/blobs/${encodeURIComponent(sha)}`
}

function apiHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'now-times-content',
    'X-GitHub-Api-Version': '2022-11-28'
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text) as unknown
}

function stringField(value: unknown, key: string): string | null {
  if (!value || typeof value !== 'object') return null
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' && field ? field : null
}

function nested(value: unknown, ...keys: string[]): unknown {
  let current = value
  for (const key of keys) {
    if (!current || typeof current !== 'object') return null
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function wantedBlob(entry: unknown, contentPath: string): { path: string; sha: string; size?: number; kind: 'markdown' | 'image' } | null {
  if (!entry || typeof entry !== 'object') return null
  const record = entry as Record<string, unknown>
  if (record.type !== 'blob' || typeof record.path !== 'string' || typeof record.sha !== 'string') return null
  if (record.path.split('/').includes('..')) return null
  const prefix = `${contentPath}/`
  if (!record.path.startsWith(prefix)) return null
  const relative = record.path.slice(prefix.length)
  const kind = relative.match(/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/)
    ? 'markdown'
    : relative.match(/^images\/[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|gif|webp)$/)
      ? 'image'
      : null
  if (!kind) return null
  const size = typeof record.size === 'number' ? record.size : undefined
  return { path: record.path, sha: record.sha, size, kind }
}

function decodeBlob(payload: unknown, maxBytes: number): Buffer | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (typeof record.size === 'number' && record.size > maxBytes) return null
  if (record.encoding !== 'base64' || typeof record.content !== 'string') return null
  const bytes = Buffer.from(record.content, 'base64')
  if (bytes.length > maxBytes) return null
  return bytes
}
