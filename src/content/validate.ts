import { lstat, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { IMAGE_MAX_BYTES, MARKDOWN_MAX_BYTES } from './directory.js'
import { isArticleSlug, parseArticleMarkdown, sniffImageType } from './parse.js'

export interface ContentLimits {
  markdownBytes: number
  imageBytes: number
}

export function duplicateSlugs(slugs: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const slug of slugs) {
    if (seen.has(slug)) duplicates.add(slug)
    seen.add(slug)
  }
  return [...duplicates].sort()
}

export async function validateContentTree(dir: string, limits: ContentLimits = {
  markdownBytes: MARKDOWN_MAX_BYTES,
  imageBytes: IMAGE_MAX_BYTES
}): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    return [`cannot read content directory: ${(error as Error).message}`]
  }

  const errors: string[] = []
  const slugs: string[] = []
  for (const entry of entries) {
    if (!entry.name.endsWith('.md')) continue
    const filename = entry.name
    const full = path.join(dir, filename)
    let stat
    try {
      stat = await lstat(full)
    } catch (error) {
      errors.push(`${filename}: ${(error as Error).message}`)
      continue
    }
    if (stat.isSymbolicLink()) {
      errors.push(`${filename}: symbolic links are not articles`)
      continue
    }
    if (!stat.isFile()) {
      errors.push(`${filename}: not a file`)
      continue
    }
    const slug = filename.slice(0, -3)
    if (!isArticleSlug(slug)) {
      errors.push(`${filename}: slug must be lowercase words separated by hyphens`)
      continue
    }
    slugs.push(slug)
    if (stat.size > limits.markdownBytes) {
      errors.push(`${filename}: article is too large`)
      continue
    }
    let article
    try {
      article = parseArticleMarkdown(slug, await readFile(full, 'utf8'))
    } catch (error) {
      errors.push(`${filename}: ${(error as Error).message}`)
      continue
    }
    if (!Number.isInteger(article.price) || article.price < 1) {
      errors.push(`${filename}: price must be a positive integer`)
      continue
    }
    errors.push(...await imageErrors(dir, filename, article.image, limits.imageBytes))
  }

  for (const slug of duplicateSlugs(slugs)) errors.push(`${slug}.md: duplicate slug`)
  errors.sort()
  return errors
}

async function imageErrors(dir: string, filename: string, image: string, maxBytes: number): Promise<string[]> {
  const name = image.slice('/images/'.length)
  const imagesDir = path.resolve(dir, 'images')
  const imagePath = path.resolve(imagesDir, name)
  const relative = path.relative(imagesDir, imagePath)
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    return [`${filename}: image is outside content/images (${image})`]
  }
  let stat
  try {
    stat = await lstat(imagePath)
  } catch {
    return [`${filename}: image file does not exist (${image})`]
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    return [`${filename}: image is not a regular file (${image})`]
  }
  if (stat.size > maxBytes) return [`${filename}: image is too large (${image})`]
  if (!sniffImageType(await readFile(imagePath))) {
    return [`${filename}: image is not a png, jpeg, gif, or webp (${image})`]
  }
  return []
}
