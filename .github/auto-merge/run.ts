import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  MergeRejected,
  PUBLISH_WORKFLOW_NAME,
  PUBLISH_WORKFLOW_PATH,
  TEST_JOB_NAME,
  mergeIfEligible,
  parseAllowlist,
  type MergeClient,
  type PullFile,
  type PullSnapshot
} from '../../src/content/auto-merge.js'

const API = 'https://api.github.com'

interface GitHubEvent {
  repository?: { default_branch?: string }
  pull_request?: { number?: number }
  workflow_run?: { head_sha?: string, event?: string, conclusion?: string }
}

export async function run(): Promise<number> {
  const token = process.env.GITHUB_TOKEN?.trim()
  const repository = process.env.GITHUB_REPOSITORY?.trim() ?? ''
  const eventName = process.env.GITHUB_EVENT_NAME ?? ''
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!token) {
    console.error('GITHUB_TOKEN is required')
    return 1
  }
  const slash = repository.indexOf('/')
  if (slash <= 0 || slash !== repository.lastIndexOf('/')) {
    console.error('GITHUB_REPOSITORY must be owner/repo')
    return 1
  }
  if (!eventPath) {
    console.error('GITHUB_EVENT_PATH is required')
    return 1
  }

  const owner = repository.slice(0, slash)
  const repo = repository.slice(slash + 1)
  const event = JSON.parse(readFileSync(eventPath, 'utf8')) as GitHubEvent
  const expectedBase = event.repository?.default_branch || 'main'
  const allowlist = parseAllowlist(readFileSync(new URL('../content-merge-allowlist.txt', import.meta.url), 'utf8'))
  if (allowlist.length === 0) {
    console.error('content merge allowlist is empty')
    return 1
  }

  if (eventName === 'workflow_run') {
    const run = event.workflow_run
    if (run?.event !== 'pull_request' || run.conclusion !== 'success' || !run.head_sha) {
      console.log('[content-auto-merge] skipped: workflow run is not a successful pull request')
      return 0
    }
  } else if (eventName !== 'pull_request_target') {
    console.log(`[content-auto-merge] skipped: ${eventName || 'unknown event'}`)
    return 0
  }

  const numbers = await pullNumbers(token, owner, repo, eventName, event)
  const client = githubClient(token, owner, repo)
  const failures: string[] = []
  for (const pullNumber of numbers) {
    try {
      const result = await mergeIfEligible({
        pullNumber,
        allowlist,
        expectedBase,
        expectedRepo: repository,
        client
      })
      console.log(`[content-auto-merge] #${pullNumber}: ${result.merge ? 'merged' : 'skipped'} (${result.reason})`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`#${pullNumber}: ${hint(message)}`)
    }
  }
  if (failures.length > 0) {
    console.error(failures.join('\n'))
    return 1
  }
  return 0
}

async function pullNumbers(token: string, owner: string, repo: string, eventName: string, event: GitHubEvent): Promise<number[]> {
  if (eventName === 'pull_request_target') {
    const number = event.pull_request?.number
    return Number.isInteger(number) && number! > 0 ? [number!] : []
  }
  const sha = event.workflow_run?.head_sha
  if (!sha || !/^[0-9a-f]{40}$/i.test(sha)) return []
  const pulls = await github<Array<{ number?: number }>>(token, `/repos/${owner}/${repo}/commits/${sha}/pulls?per_page=100`)
  return pulls
    .map(pull => pull.number)
    .filter((number): number is number => Number.isInteger(number) && number! > 0)
}

function githubClient(token: string, owner: string, repo: string): MergeClient {
  return {
    async getPull(pullNumber): Promise<PullSnapshot> {
      const pull = await github<Record<string, unknown>>(token, `/repos/${owner}/${repo}/pulls/${pullNumber}`)
      const user = record(pull.user)
      const head = record(pull.head)
      const base = record(pull.base)
      const baseRepo = record(base.repo)
      return {
        number: Number(pull.number),
        draft: pull.draft === true,
        state: String(pull.state ?? ''),
        merged: pull.merged === true,
        author: typeof user.login === 'string' ? user.login : '',
        headSha: typeof head.sha === 'string' ? head.sha : '',
        baseRef: typeof base.ref === 'string' ? base.ref : '',
        baseRepo: typeof baseRepo.full_name === 'string' ? baseRepo.full_name : ''
      }
    },
    async listFiles(pullNumber): Promise<PullFile[]> {
      const files: PullFile[] = []
      for (let page = 1; page <= 30; page += 1) {
        const batch = await github<PullFile[]>(token, `/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100&page=${page}`)
        files.push(...batch)
        if (batch.length < 100) return files
      }
      throw new MergeRejected('other', 'file list did not end; refusing to merge')
    },
    async testJobPassed(headSha): Promise<boolean> {
      if (!/^[0-9a-f]{40}$/i.test(headSha)) return false
      const listed = await github<{ workflow_runs?: Array<Record<string, unknown>> }>(
        token,
        `/repos/${owner}/${repo}/actions/runs?head_sha=${headSha}&event=pull_request&per_page=20`
      )
      const runs = (listed.workflow_runs ?? [])
        .filter(run => run.name === PUBLISH_WORKFLOW_NAME && run.path === PUBLISH_WORKFLOW_PATH && run.head_sha === headSha)
        .sort((a, b) => Date.parse(String(b.created_at)) - Date.parse(String(a.created_at)))
      const latest = runs[0]
      if (!latest || latest.status !== 'completed' || latest.conclusion !== 'success') return false
      const jobs = await github<{ jobs?: Array<Record<string, unknown>>, total_count?: number }>(
        token,
        `/repos/${owner}/${repo}/actions/runs/${Number(latest.id)}/jobs?per_page=100`
      )
      if ((jobs.total_count ?? 0) > (jobs.jobs?.length ?? 0)) return false
      const tests = (jobs.jobs ?? []).filter(job => job.name === TEST_JOB_NAME)
      return tests.length > 0 && tests.every(job => job.conclusion === 'success')
    },
    async approve(pullNumber): Promise<void> {
      await github(token, `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          event: 'APPROVE',
          body: 'Content-only pull request from an allowlisted author. The test job passed.'
        })
      })
    },
    async merge(pullNumber, headSha): Promise<void> {
      let response: Response
      try {
        response = await fetch(`${API}/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
          method: 'PUT',
          headers: githubHeaders(token),
          body: JSON.stringify({ sha: headSha, merge_method: 'merge' })
        })
      } catch (error) {
        throw new MergeRejected('other', (error as Error).message)
      }
      const payload = await response.json().catch(() => ({})) as { message?: string, merged?: boolean }
      if (response.ok && payload.merged !== false) return
      const message = payload.message || `merge failed with HTTP ${response.status}`
      throw classifyMergeFailure(response.status, message)
    }
  }
}

async function github<T>(token: string, pathname: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${pathname}`, { ...init, headers: { ...githubHeaders(token), ...init.headers } })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload
      ? String((payload as { message: unknown }).message)
      : `HTTP ${response.status}`
    throw new MergeRejected(response.status === 409 ? 'sha' : 'other', `${pathname}: ${message}`)
  }
  return payload as T
}

function githubHeaders(token: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'now-times-content-merge',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

export function classifyMergeFailure(status: number, message: string): MergeRejected {
  if (status === 409 || /already merged|head sha/i.test(message)) return new MergeRejected('sha', message)
  if (/status checks? .*(pending|expected|have not completed)/i.test(message)) return new MergeRejected('wait', message)
  if (/approv|review required|code owner/i.test(message)) return new MergeRejected('review', message)
  return new MergeRejected('other', message)
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function hint(message: string): string {
  if (!/approv|review|permission|resource not accessible|403/i.test(message)) return message
  return `${message}\nThe token could not merge. In Settings → Actions → General, set Workflow permissions to Read and write. If main requires a review, also enable Allow GitHub Actions to create and approve pull requests.`
}

function runningAsCli(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  return import.meta.url === pathToFileURL(path.resolve(entry)).href
}

if (runningAsCli()) {
  run().then(code => {
    if (code !== 0) process.exit(code)
  }).catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
