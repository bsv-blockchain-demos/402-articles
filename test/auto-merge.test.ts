import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  MergeRejected,
  PUBLISH_WORKFLOW_NAME,
  TEST_JOB_NAME,
  collectPaths,
  decideAutoMerge,
  isAutoMergePath,
  mergeIfEligible,
  parseAllowlist,
  type MergeClient,
  type PullSnapshot
} from '../src/content/auto-merge.js'
import { classifyMergeFailure } from '../.github/auto-merge/run.js'

const allowlist = ['sirdeggen']

function pull(overrides: Partial<PullSnapshot> = {}): PullSnapshot {
  return {
    number: 8,
    draft: false,
    state: 'open',
    merged: false,
    author: 'sirdeggen',
    headSha: 'a'.repeat(40),
    baseRef: 'main',
    baseRepo: 'bsv-blockchain-demos/402-articles',
    ...overrides
  }
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    state: 'open',
    draft: false,
    author: 'sirdeggen',
    files: [{ filename: 'content/brc-week-1chickennugget.md', status: 'added' }],
    testsPassed: true,
    allowlist,
    baseRef: 'main',
    baseRepo: 'bsv-blockchain-demos/402-articles',
    expectedBase: 'main',
    expectedRepo: 'bsv-blockchain-demos/402-articles',
    ...overrides
  }
}

describe('content auto-merge policy', () => {
  it('keeps sirdeggen on the allowlist and ignores comments', () => {
    const text = readFileSync(new URL('../.github/content-merge-allowlist.txt', import.meta.url), 'utf8')
    const parsed = parseAllowlist(text)
    assert.deepEqual(parsed.map(name => name.toLowerCase()).filter(name => name === 'sirdeggen'), ['sirdeggen'])
    assert.deepEqual(parseAllowlist('# note\n\nSirDeggen\nnot a login!\n'), ['SirDeggen'])
    assert.equal(parseAllowlist('').length, 0)
  })

  it('accepts only article markdown and content images', () => {
    assert.equal(isAutoMergePath('content/brc-week-1chickennugget.md'), true)
    assert.equal(isAutoMergePath('content/images/brc-week-1chickennugget.jpg'), true)
    assert.equal(isAutoMergePath('content/images/g1.png'), true)
    assert.equal(isAutoMergePath('src/server.ts'), false)
    assert.equal(isAutoMergePath('test/content.test.ts'), false)
    assert.equal(isAutoMergePath('.github/workflows/auto-merge-content.yml'), false)
    assert.equal(isAutoMergePath('.github/content-merge-allowlist.txt'), false)
    assert.equal(isAutoMergePath('README.md'), false)
    assert.equal(isAutoMergePath('content/Not_A_Slug.md'), false)
    assert.equal(isAutoMergePath('content/images/notes.txt'), false)
    assert.equal(isAutoMergePath('content/nested/story.md'), false)
    assert.deepEqual(collectPaths([
      { filename: 'content/new-name.md', status: 'renamed', previous_filename: 'src/articles.ts' }
    ]), ['content/new-name.md', 'src/articles.ts'])
  })

  it('merges only a ready content pull request from an allowlisted author after tests pass', () => {
    assert.equal(decideAutoMerge(input()).merge, true)
    assert.equal(decideAutoMerge(input({ author: 'SirDeggen' })).merge, true)
    assert.equal(decideAutoMerge(input({ draft: true })).merge, false)
    assert.equal(decideAutoMerge(input({ author: 'someone-else' })).reason.includes('not allowlisted'), true)
    assert.equal(decideAutoMerge(input({ testsPassed: false })).merge, false)
    assert.equal(decideAutoMerge(input({ state: 'closed' })).merge, false)
    assert.equal(decideAutoMerge(input({
      files: [
        { filename: 'content/story.md', status: 'modified' },
        { filename: 'content/images/story.webp', status: 'added' }
      ]
    })).merge, true)
    const code = decideAutoMerge(input({
      files: [
        { filename: 'content/story.md', status: 'modified' },
        { filename: 'src/server.ts', status: 'modified' }
      ]
    }))
    assert.equal(code.merge, false)
    assert.match(code.reason, /src\/server\.ts/)
    const renamed = decideAutoMerge(input({
      files: [{ filename: 'content/story.md', status: 'renamed', previous_filename: 'README.md' }]
    }))
    assert.equal(renamed.merge, false)
  })

  it('approves only when the merge is rejected for lack of a review', async () => {
    const calls: string[] = []
    const snapshot = pull()
    const client: MergeClient = {
      async getPull() { return snapshot },
      async listFiles() { return [{ filename: 'content/story.md', status: 'added' }] },
      async testJobPassed() { return true },
      async approve() { calls.push('approve') },
      async merge(_number, sha) {
        calls.push(`merge:${sha}`)
        if (!calls.includes('approve')) throw new MergeRejected('review', 'review required')
      }
    }
    const result = await mergeIfEligible({
      pullNumber: 8,
      allowlist,
      expectedBase: 'main',
      expectedRepo: 'bsv-blockchain-demos/402-articles',
      client
    })
    assert.equal(result.merge, true)
    assert.deepEqual(calls, [`merge:${'a'.repeat(40)}`, 'approve', `merge:${'a'.repeat(40)}`])
  })

  it('does not merge a draft, a code change, a failing test, or a moved head', async () => {
    const denied = async (snapshot: PullSnapshot, files: MergeClient['listFiles']) => {
      const calls: string[] = []
      const client: MergeClient = {
        async getPull() { return snapshot },
        listFiles: files,
        async testJobPassed() { return snapshot.headSha === 'a'.repeat(40) },
        async approve() { calls.push('approve') },
        async merge() { calls.push('merge') }
      }
      const result = await mergeIfEligible({
        pullNumber: snapshot.number,
        allowlist,
        expectedBase: 'main',
        expectedRepo: 'bsv-blockchain-demos/402-articles',
        client
      })
      assert.equal(result.merge, false)
      assert.deepEqual(calls, [])
      return result.reason
    }

    assert.match(await denied(pull({ draft: true }), async () => [{ filename: 'content/story.md' }]), /draft/)
    assert.match(await denied(pull({ author: 'octocat' }), async () => [{ filename: 'content/story.md' }]), /allowlist/)
    assert.match(await denied(pull(), async () => [{ filename: 'src/wallet.ts' }]), /outside content/)
    assert.match(await denied(pull({ headSha: 'b'.repeat(40) }), async () => [{ filename: 'content/story.md' }]), /test job/)

    let reads = 0
    const calls: string[] = []
    const client: MergeClient = {
      async getPull() {
        reads += 1
        return pull({ headSha: reads === 1 ? 'a'.repeat(40) : 'c'.repeat(40) })
      },
      async listFiles() { return [{ filename: 'content/story.md' }] },
      async testJobPassed() { return true },
      async approve() { calls.push('approve') },
      async merge() { calls.push('merge') }
    }
    const moved = await mergeIfEligible({
      pullNumber: 8,
      allowlist,
      expectedBase: 'main',
      expectedRepo: 'bsv-blockchain-demos/402-articles',
      client
    })
    assert.equal(moved.merge, false)
    assert.match(moved.reason, /changed/)
    assert.deepEqual(calls, [])
  })

  it('classifies merge errors and keeps the workflow from checking out pull-request code', () => {
    assert.equal(classifyMergeFailure(405, 'At least 1 approving review is required').kind, 'review')
    assert.equal(classifyMergeFailure(405, 'Required status check "test" is expected.').kind, 'wait')
    assert.equal(classifyMergeFailure(409, 'head sha changed').kind, 'sha')
    assert.equal(classifyMergeFailure(405, 'Merge conflict').kind, 'other')

    const workflow = readFileSync(new URL('../.github/workflows/auto-merge-content.yml', import.meta.url), 'utf8')
    const publish = readFileSync(new URL('../.github/workflows/docker-publish.yml', import.meta.url), 'utf8')
    assert.match(publish, new RegExp(`^name: ${PUBLISH_WORKFLOW_NAME}$`, 'm'))
    assert.match(publish, new RegExp(`^ {2}${TEST_JOB_NAME}:$`, 'm'))
    assert.match(publish, /contents: read/)
    assert.match(publish, /npm run validate-content/)
    assert.match(workflow, /workflows: \['Build and Publish Docker Image'\]/)
    assert.match(workflow, /pull_request_target:/)
    assert.match(workflow, /ref: \$\{\{ github\.event\.repository\.default_branch \}\}/)
    assert.match(workflow, /persist-credentials: false/)
    assert.match(workflow, /contents: write/)
    assert.match(workflow, /pull-requests: write/)
    assert.match(workflow, /npm ci --ignore-scripts/)
    assert.equal(workflow.includes('pull_request.head.sha'), false)
    assert.equal(/ref:.*head/.test(workflow), false)
    assert.equal(workflow.includes('head.ref'), false)
  })
})
