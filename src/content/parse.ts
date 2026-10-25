import matter from 'gray-matter'
import yaml from 'js-yaml'
import { marked } from 'marked'
import { sanitizeArticleHtml } from './html.js'
import type { Article } from './types.js'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const IMAGE = /^\/images\/[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|gif|webp)$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const MAX_MARKDOWN_CHARS = 500_000

const yamlEngine = {
  parse(input: string): object {
    const parsed = yaml.load(input, { schema: yaml.CORE_SCHEMA })
    if (parsed == null) return {}
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('front matter must be a mapping')
    }
    return parsed
  }
}

marked.use({ gfm: true, breaks: false })

export function isArticleSlug(slug: string): boolean {
  return SLUG.test(slug)
}

export function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 6) {
    const header = bytes.subarray(0, 6).toString('ascii')
    if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif'
  }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp'
  }
  return null
}

export function imageContentType(name: string): string | null {
  const ext = name.toLowerCase().split('.').pop()
  switch (ext) {
    case 'png': return 'image/png'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'gif': return 'image/gif'
    case 'webp': return 'image/webp'
    default: return null
  }
}

export function isContentImageName(name: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|gif|webp)$/.test(name) && imageContentType(name) != null
}

export function parseArticleMarkdown(slug: string, raw: string): Article {
  if (!isArticleSlug(slug)) {
    throw new Error('slug must be lowercase words separated by hyphens')
  }
  const source = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
  if (source.length > MAX_MARKDOWN_CHARS) {
    throw new Error('article is too large')
  }

  const parsed = matter(source, { engines: { yaml: yamlEngine } })
  const data = parsed.data ?? {}
  const title = requiredString(data.title, 'title', 300)
  const excerpt = requiredString(data.excerpt, 'excerpt', 500)
  const author = requiredString(data.author, 'author', 200)
  const date = requiredDate(data.date)
  const price = requiredPrice(data.price)
  const image = requiredImage(data.image)
  const body = parsed.content.trim()
  if (!body) {
    throw new Error('article body is empty')
  }

  const rendered = marked.parse(body, { async: false }) as string
  const content = sanitizeArticleHtml(rendered).trim()
  if (!content) {
    throw new Error('article body is empty after sanitizing')
  }

  return { slug, title, excerpt, author, date, image, content, price }
}

function requiredString(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  const trimmed = value.trim()
  if (!trimmed) throw new Error(`${field} is required`)
  if (trimmed.length > max) throw new Error(`${field} is too long`)
  return trimmed
}

function requiredDate(value: unknown): string {
  if (typeof value !== 'string' || !DATE.test(value)) {
    throw new Error('date must be YYYY-MM-DD')
  }
  const [year, month, day] = value.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    throw new Error('date must be a real calendar date')
  }
  return value
}

function requiredPrice(value: unknown): number {
  const price = typeof value === 'number'
    ? value
    : typeof value === 'string' && /^[0-9]+$/.test(value)
      ? Number(value)
      : Number.NaN
  if (!Number.isInteger(price) || price < 1 || price > 1_000_000_000) {
    throw new Error('price must be a positive integer number of satoshis')
  }
  return price
}

function requiredImage(value: unknown): string {
  if (typeof value !== 'string' || !IMAGE.test(value.trim())) {
    throw new Error('image must be a /images/<file> path for png, jpeg, gif, or webp')
  }
  return value.trim()
}
