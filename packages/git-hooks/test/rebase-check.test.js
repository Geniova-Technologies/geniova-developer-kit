import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

const { execSync } = await import('node:child_process')
const { runRebaseCheck } = await import('../src/checks/rebase-check.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('rebase-check', () => {
  it('passes when branch is up to date with origin/main', () => {
    // fetch succeeds
    execSync.mockImplementation((cmd) => {
      if (cmd.includes('fetch')) return ''
      if (cmd.includes('rev-parse')) return 'feat/test-branch\n'
      if (cmd.includes('rev-list --count')) return '0\n'
      return ''
    })

    const result = runRebaseCheck()
    expect(result.passed).toBe(true)
    expect(result.behindCount).toBe(0)
  })

  it('fails when branch is behind origin/main', () => {
    execSync.mockImplementation((cmd) => {
      if (cmd.includes('fetch')) return ''
      if (cmd.includes('rev-parse')) return 'feat/test-branch\n'
      if (cmd.includes('rev-list --count')) return '3\n'
      if (cmd.includes('log --oneline')) return 'abc1234 fix: something\ndef5678 feat: other\nghi9012 chore: bump\n'
      return ''
    })

    const result = runRebaseCheck()
    expect(result.passed).toBe(false)
    expect(result.behindCount).toBe(3)
    expect(result.missingCommits).toHaveLength(3)
  })

  it('passes gracefully when fetch fails (offline)', () => {
    execSync.mockImplementation((cmd) => {
      if (cmd.includes('fetch')) throw new Error('network error')
      return ''
    })

    const result = runRebaseCheck()
    expect(result.passed).toBe(true)
  })

  it('passes gracefully when rev-parse fails', () => {
    execSync.mockImplementation((cmd) => {
      if (cmd.includes('fetch')) return ''
      if (cmd.includes('rev-parse')) throw new Error('not a git repo')
      return ''
    })

    const result = runRebaseCheck()
    expect(result.passed).toBe(true)
  })

  it('passes gracefully when rev-list fails', () => {
    execSync.mockImplementation((cmd) => {
      if (cmd.includes('fetch')) return ''
      if (cmd.includes('rev-parse')) return 'feat/test\n'
      if (cmd.includes('rev-list')) throw new Error('bad ref')
      return ''
    })

    const result = runRebaseCheck()
    expect(result.passed).toBe(true)
  })

  it('uses custom baseBranch and remote', () => {
    const calls = []
    execSync.mockImplementation((cmd) => {
      calls.push(cmd)
      if (cmd.includes('fetch')) return ''
      if (cmd.includes('rev-parse')) return 'feat/test\n'
      if (cmd.includes('rev-list --count')) return '0\n'
      return ''
    })

    runRebaseCheck({ baseBranch: 'develop', remote: 'upstream' })

    expect(calls.some((c) => c.includes('fetch upstream develop'))).toBe(true)
    expect(calls.some((c) => c.includes('upstream/develop'))).toBe(true)
  })
})
