import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { bundledContentDir } from '../src/content/store.js'
import { duplicateSlugs, validateContentTree } from '../src/content/validate.js'

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

function article(fields: Record<string, string | number>, body = '<p>Body</p>'): string {
  const values = {
    title: 'Title',
    excerpt: 'Excerpt',
    author: 'Author',
    date: '2026-01-02',
    price: 10,
    image: '/images/pic.png',
    ...fields
  }
  const lines = ['---']
  for (const [key, value] of Object.entries(values)) {
    lines.push(`${key}: ${typeof value === 'string' ? JSON.stringify(value) : value}`)
  }
  lines.push('---', body)
  return lines.join('\n')
}

describe('content validation', () => {
  it('accepts the bundled articles and reports duplicate slugs', async () => {
    assert.deepEqual(await validateContentTree(bundledContentDir()), [])
    assert.deepEqual(duplicateSlugs(['alpha', 'beta', 'alpha']), ['alpha'])
  })

  it('rejects broken front matter, a bad price, a missing image, and a duplicate-sized file', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'now-times-content-'))
    try {
      await mkdir(path.join(dir, 'images'))
      await writeFile(path.join(dir, 'images', 'pic.png'), PNG)
      await writeFile(path.join(dir, 'good-story.md'), article({}))
      await writeFile(path.join(dir, 'free-story.md'), article({ price: 0 }))
      await writeFile(path.join(dir, 'partial-story.md'), article({ price: 1.5 }))
      await writeFile(path.join(dir, 'no-picture.md'), article({ image: '/images/missing.png' }))
      await writeFile(path.join(dir, 'bad image.md'), article({}))
      await writeFile(path.join(dir, 'broken.md'), '---\ntitle: [\n')
      await writeFile(path.join(dir, 'images', 'notes.png'), 'not an image')
      await writeFile(path.join(dir, 'fake-picture.md'), article({ image: '/images/notes.png' }))
      await symlink(path.join(dir, 'good-story.md'), path.join(dir, 'linked-story.md'))

      const errors = await validateContentTree(dir)
      assert.match(errors.join('\n'), /free-story\.md: price must be a positive integer/)
      assert.match(errors.join('\n'), /partial-story\.md: price must be a positive integer/)
      assert.match(errors.join('\n'), /no-picture\.md: image file does not exist/)
      assert.match(errors.join('\n'), /bad image\.md: slug must be lowercase/)
      assert.match(errors.join('\n'), /broken\.md:/)
      assert.match(errors.join('\n'), /fake-picture\.md: image is not a png/)
      assert.match(errors.join('\n'), /linked-story\.md: symbolic links are not articles/)
      assert.equal(errors.some(error => error.startsWith('good-story.md')), false)

      const huge = await validateContentTree(dir, { markdownBytes: 10, imageBytes: 8 * 1024 * 1024 })
      assert.match(huge.join('\n'), /good-story\.md: article is too large/)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
