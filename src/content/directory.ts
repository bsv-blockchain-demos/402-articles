import { lstat, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { isArticleSlug, isContentImageName } from './parse.js'

export const MARKDOWN_MAX_BYTES = 512 * 1024
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024

export interface DirectoryMarkdown {
  slug: string
  raw: string
}

export interface DirectoryImage {
  name: string
  bytes: Buffer
}

export interface DirectorySnapshot {
  markdown: DirectoryMarkdown[]
  images: DirectoryImage[]
  errors: string[]
}

export class ContentReadError extends Error {}

export async function readContentDirectory(dir: string): Promise<DirectorySnapshot> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    throw new ContentReadError(`cannot read content directory: ${(error as Error).message}`)
  }

  const markdown: DirectoryMarkdown[] = []
  const images: DirectoryImage[] = []
  const errors: string[] = []

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const slug = entry.name.slice(0, -3)
      if (!isArticleSlug(slug)) continue
      const loaded = await readBounded(path.join(dir, entry.name), MARKDOWN_MAX_BYTES)
      if (typeof loaded === 'string') {
        errors.push(`${entry.name}: ${loaded}`)
        continue
      }
      markdown.push({ slug, raw: loaded.toString('utf8') })
      continue
    }
    if (entry.isDirectory() && entry.name === 'images') {
      await readImages(path.join(dir, 'images'), images, errors)
    }
  }

  markdown.sort((a, b) => a.slug.localeCompare(b.slug))
  images.sort((a, b) => a.name.localeCompare(b.name))
  return { markdown, images, errors }
}

async function readImages(dir: string, images: DirectoryImage[], errors: string[]): Promise<void> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    errors.push(`images: ${(error as Error).message}`)
    return
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink() || !entry.isFile()) continue
    if (!isContentImageName(entry.name)) continue
    const loaded = await readBounded(path.join(dir, entry.name), IMAGE_MAX_BYTES)
    if (typeof loaded === 'string') {
      errors.push(`images/${entry.name}: ${loaded}`)
      continue
    }
    images.push({ name: entry.name, bytes: loaded })
  }
}

async function readBounded(file: string, maxBytes: number): Promise<Buffer | string> {
  try {
    const stat = await lstat(file)
    if (!stat.isFile()) return 'not a regular file'
    if (stat.size > maxBytes) return 'file is too large'
    return await readFile(file)
  } catch (error) {
    return (error as Error).message
  }
}
