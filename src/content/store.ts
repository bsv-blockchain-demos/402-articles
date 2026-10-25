import { createHash } from 'node:crypto'
import path from 'node:path'
import { readContentDirectory } from './directory.js'
import { fetchGithubSnapshot, type GithubConfig, type GithubSyncState } from './github.js'
import { parseArticleMarkdown, sniffImageType } from './parse.js'
import type { Article, ContentImage, ContentLogger } from './types.js'

export interface ContentOptions {
  dir: string
  source: 'local' | 'github'
  pollMs: number
  github?: GithubConfig | null
  fetchImpl?: typeof fetch
  logger?: ContentLogger
}

export type RefreshResult =
  | { kind: 'not-modified'; commit?: string }
  | { kind: 'updated'; commit?: string; articles: number }
  | { kind: 'failed'; reason: string }

const silentLogger: ContentLogger = { info() {}, warn() {} }

export function bundledContentDir(): string {
  return path.resolve(import.meta.dirname, '../../content')
}

export class ContentStore {
  private articles: Article[] = []
  private images = new Map<string, ContentImage>()
  private baseImages = new Map<string, ContentImage>()
  private syncState: GithubSyncState = { files: new Map() }
  private chain: Promise<void> = Promise.resolve()
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly log: ContentLogger

  constructor(private readonly options: ContentOptions) {
    this.log = options.logger ?? silentLogger
  }

  async loadInitial(): Promise<void> {
    try {
      const snapshot = await readContentDirectory(this.options.dir)
      this.applyDirectory(snapshot, true)
      this.log.info(`Loaded ${this.articles.length} bundled articles`)
      for (const error of snapshot.errors) this.log.warn(`Bundled content: ${error}`)
    } catch (error) {
      this.log.warn(`Bundled content unavailable: ${(error as Error).message}`)
    }
  }

  getArticle(slug: string): Article | undefined {
    return this.articles.find(article => article.slug === slug)
  }

  getAllArticles(): Omit<Article, 'content'>[] {
    return this.articles.map(({ content: _content, ...article }) => article)
  }

  getImage(name: string): ContentImage | undefined {
    return this.images.get(name)
  }

  start(): void {
    if (this.timer) return
    const tick = () => {
      void this.refresh().then(result => {
        if (result.kind === 'failed') this.log.warn(`Content refresh failed: ${result.reason}`)
      })
    }
    if (this.options.source === 'github') tick()
    if (this.options.pollMs > 0) {
      this.timer = setInterval(tick, this.options.pollMs)
      this.timer.unref()
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  refresh(opts?: { force?: boolean }): Promise<RefreshResult> {
    const run = this.chain.then(() => this.refreshInner(opts))
    this.chain = run.then(() => undefined, () => undefined)
    return run
  }

  private async refreshInner(opts?: { force?: boolean }): Promise<RefreshResult> {
    if (this.options.source === 'local') return this.refreshLocal()
    return this.refreshGithub(opts)
  }

  private async refreshLocal(): Promise<RefreshResult> {
    try {
      const snapshot = await readContentDirectory(this.options.dir)
      const previous = this.fingerprint()
      this.applyDirectory(snapshot, true)
      for (const error of snapshot.errors) this.log.warn(`Local content: ${error}`)
      if (previous === this.fingerprint()) return { kind: 'not-modified' }
      this.log.info(`Content updated (${this.articles.length} articles, local)`)
      return { kind: 'updated', articles: this.articles.length }
    } catch (error) {
      return { kind: 'failed', reason: (error as Error).message }
    }
  }

  private async refreshGithub(opts?: { force?: boolean }): Promise<RefreshResult> {
    const config = this.options.github
    if (!config) return { kind: 'failed', reason: 'invalid content repository configuration' }
    const snapshot = await fetchGithubSnapshot(config, this.syncState, this.options.fetchImpl ?? fetch, opts)
    if (snapshot.kind !== 'updated') return snapshot

    const markdown: { slug: string; raw: string }[] = []
    const images: { name: string; bytes: Buffer }[] = []
    const prefix = `${config.path}/`
    for (const [filePath, file] of snapshot.files) {
      if (!filePath.startsWith(prefix)) continue
      const relative = filePath.slice(prefix.length)
      if (/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(relative)) {
        markdown.push({ slug: relative.slice(0, -3), raw: file.bytes.toString('utf8') })
      } else if (/^images\/[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|gif|webp)$/.test(relative)) {
        images.push({ name: relative.slice('images/'.length), bytes: file.bytes })
      }
    }

    const built = buildArticles(markdown)
    for (const error of built.errors) this.log.warn(`Remote content: ${error}`)
    this.syncState = { etag: snapshot.etag ?? undefined, commit: snapshot.commit, files: snapshot.files }
    this.images = mergeImages(this.baseImages, toImageMap(images))

    if (markdown.length > 0 && built.articles.length === 0 && this.articles.length > 0) {
      return { kind: 'failed', reason: built.errors.join('; ') || 'remote articles could not be parsed' }
    }
    if (markdown.length === 0 && this.articles.length > 0) {
      return { kind: 'failed', reason: 'remote content has no articles' }
    }

    this.articles = built.articles
    this.warnMissingImages()
    this.log.info(`Content updated (${this.articles.length} articles, ${snapshot.commit.slice(0, 7)})`)
    return { kind: 'updated', commit: snapshot.commit, articles: this.articles.length }
  }

  private applyDirectory(snapshot: { markdown: { slug: string; raw: string }[]; images: { name: string; bytes: Buffer }[]; errors: string[] }, asBase: boolean): void {
    const built = buildArticles(snapshot.markdown)
    if (snapshot.markdown.length > 0 && built.articles.length === 0 && this.articles.length > 0) {
      throw new Error(built.errors.join('; ') || 'content could not be parsed')
    }
    const images = toImageMap(snapshot.images)
    this.articles = built.articles
    if (asBase) this.baseImages = images
    this.images = images
    for (const error of built.errors) this.log.warn(`Content: ${error}`)
    this.warnMissingImages()
  }

  private warnMissingImages(): void {
    for (const article of this.articles) {
      const name = article.image.slice('/images/'.length)
      if (!this.images.has(name)) this.log.warn(`${article.slug}: missing ${article.image}`)
    }
  }

  private fingerprint(): string {
    const articles = this.articles.map(article => {
      const hash = createHash('sha256')
        .update(article.title)
        .update(article.excerpt)
        .update(article.author)
        .update(article.content)
        .digest('hex')
      return `${article.slug}:${article.price}:${article.date}:${article.image}:${hash}`
    }).join('|')
    const images = [...this.images.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, image]) => `${name}:${createHash('sha256').update(image.body).digest('hex')}`)
      .join('|')
    return `${articles}#${images}`
  }
}

function buildArticles(files: { slug: string; raw: string }[]): { articles: Article[]; errors: string[] } {
  const articles: Article[] = []
  const errors: string[] = []
  for (const file of files) {
    try {
      articles.push(parseArticleMarkdown(file.slug, file.raw))
    } catch (error) {
      errors.push(`${file.slug}: ${(error as Error).message}`)
    }
  }
  articles.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
  return { articles, errors }
}

function toImageMap(images: { name: string; bytes: Buffer }[]): Map<string, ContentImage> {
  const map = new Map<string, ContentImage>()
  for (const image of images) {
    const contentType = sniffImageType(image.bytes)
    if (!contentType) continue
    map.set(image.name, { name: image.name, contentType, body: image.bytes })
  }
  return map
}

function mergeImages(base: Map<string, ContentImage>, overlay: Map<string, ContentImage>): Map<string, ContentImage> {
  const merged = new Map(base)
  for (const [name, image] of overlay) merged.set(name, image)
  return merged
}
