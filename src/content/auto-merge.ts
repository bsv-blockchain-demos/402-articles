export const PUBLISH_WORKFLOW_NAME = 'Build and Publish Docker Image'
export const PUBLISH_WORKFLOW_PATH = '.github/workflows/docker-publish.yml'
export const TEST_JOB_NAME = 'test'

const ARTICLE_PATH = /^content\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/
const IMAGE_PATH = /^content\/images\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|gif|webp)$/
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/

export interface PullFile {
  filename: string
  status?: string
  previous_filename?: string | null
}

export interface PullSnapshot {
  number: number
  draft: boolean
  state: string
  merged: boolean
  author: string
  headSha: string
  baseRef: string
  baseRepo: string
}

export interface AutoMergeInput {
  state: string
  merged?: boolean
  draft: boolean
  author: string
  files: PullFile[]
  testsPassed: boolean
  allowlist: string[]
  baseRef: string
  baseRepo: string
  expectedBase: string
  expectedRepo: string
}

export interface AutoMergeDecision {
  merge: boolean
  reason: string
}

export function parseAllowlist(text: string): string[] {
  const names: string[] = []
  for (const line of text.split(/\r?\n/)) {
    const login = line.replace(/#.*/, '').trim()
    if (!login) continue
    if (!LOGIN.test(login)) continue
    names.push(login)
  }
  return names
}

export function isAllowlistedAuthor(author: string, allowlist: string[]): boolean {
  const login = author.trim().toLowerCase()
  if (!login) return false
  return allowlist.some(entry => entry.toLowerCase() === login)
}

export function isAutoMergePath(file: string): boolean {
  return ARTICLE_PATH.test(file) || IMAGE_PATH.test(file)
}

export function collectPaths(files: PullFile[]): string[] {
  const paths: string[] = []
  for (const file of files) {
    if (!file || typeof file.filename !== 'string' || file.filename.length === 0) {
      paths.push('')
      continue
    }
    paths.push(file.filename)
    if (file.status === 'renamed' || file.status === 'copied' || file.previous_filename) {
      paths.push(typeof file.previous_filename === 'string' ? file.previous_filename : '')
    }
  }
  return paths
}

export function decideAutoMerge(input: AutoMergeInput): AutoMergeDecision {
  if (input.merged) return skip('pull request is already merged')
  if (input.state !== 'open') return skip('pull request is not open')
  if (input.baseRef !== input.expectedBase || input.baseRepo !== input.expectedRepo) {
    return skip('pull request does not target the default branch of this repository')
  }
  if (input.draft) return skip('pull request is a draft')
  if (!isAllowlistedAuthor(input.author, input.allowlist)) {
    return skip(`author ${input.author || '(none)'} is not allowlisted`)
  }
  if (!input.testsPassed) return skip('test job has not passed for the current head')
  const paths = collectPaths(input.files)
  if (paths.length === 0) return skip('pull request has no changed files')
  const blocked = paths.filter(file => !isAutoMergePath(file))
  if (blocked.length > 0) {
    return skip(`changes outside content articles and images: ${blocked.slice(0, 5).join(', ')}`)
  }
  return { merge: true, reason: 'content-only pull request from an allowlisted author' }
}

export class MergeRejected extends Error {
  constructor(readonly kind: 'review' | 'sha' | 'wait' | 'other', message: string) {
    super(message)
    this.name = 'MergeRejected'
  }
}

export interface MergeClient {
  getPull(pullNumber: number): Promise<PullSnapshot>
  listFiles(pullNumber: number): Promise<PullFile[]>
  testJobPassed(headSha: string): Promise<boolean>
  approve(pullNumber: number): Promise<void>
  merge(pullNumber: number, headSha: string): Promise<void>
}

export async function mergeIfEligible(input: {
  pullNumber: number
  allowlist: string[]
  expectedBase: string
  expectedRepo: string
  client: MergeClient
}): Promise<AutoMergeDecision> {
  const pull = await input.client.getPull(input.pullNumber)
  if (pull.merged) return skip('pull request is already merged')
  const files = await input.client.listFiles(input.pullNumber)
  const testsPassed = await input.client.testJobPassed(pull.headSha)
  const decision = decideAutoMerge({
    ...pull,
    files,
    testsPassed,
    allowlist: input.allowlist,
    expectedBase: input.expectedBase,
    expectedRepo: input.expectedRepo
  })
  if (!decision.merge) return decision

  const current = await input.client.getPull(input.pullNumber)
  if (current.merged) return skip('pull request is already merged')
  if (current.headSha !== pull.headSha || current.draft !== pull.draft || current.author !== pull.author) {
    return skip('pull request changed while it was being checked')
  }

  let approved = false
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await input.client.merge(input.pullNumber, pull.headSha)
      return approved ? { merge: true, reason: 'approved and merged' } : decision
    } catch (error) {
      if (!(error instanceof MergeRejected)) throw error
      if (error.kind === 'sha' || error.kind === 'wait') return skip(error.message)
      if (error.kind === 'review' && !approved) {
        await input.client.approve(input.pullNumber)
        approved = true
        continue
      }
      throw error
    }
  }
  return skip('merge was not completed')
}

function skip(reason: string): AutoMergeDecision {
  return { merge: false, reason }
}
