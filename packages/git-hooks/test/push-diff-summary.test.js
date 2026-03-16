import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

const { execSync } = await import('node:child_process')
const { runPushDiffSummary } = await import('../src/checks/push-diff-summary.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('push-diff-summary', () => {
  it('returns summary with commit count, file count, and lines', () => {
    execSync.mockImplementation((cmd) => {
      if (cmd.includes('merge-base')) return 'abc123\n'
      if (cmd.includes('rev-list --count')) return '5\n'
      if (cmd.includes('--name-only')) return 'src/foo.js\nsrc/bar.js\n'
      if (cmd.includes('--stat')) return ' src/foo.js | 10 ++++\n src/bar.js | 5 ++---\n 2 files changed\n'
      if (cmd.includes('--shortstat')) return ' 2 files changed, 10 insertions(+), 3 deletions(-)\n'
      return ''
    })

    const result = runPushDiffSummary()
    expect(result.commitCount).toBe(5)
    expect(result.fileCount).toBe(2)
    expect(result.files).toEqual(['src/foo.js', 'src/bar.js'])
    expect(result.linesChanged).toBe(13)
  })

  it('returns empty result when merge-base fails', () => {
    execSync.mockImplementation(() => { throw new Error('no merge-base') })

    const result = runPushDiffSummary()
    expect(result.commitCount).toBe(0)
    expect(result.fileCount).toBe(0)
    expect(result.files).toEqual([])
  })

  it('handles empty diff gracefully', () => {
    execSync.mockImplementation((cmd) => {
      if (cmd.includes('merge-base')) return 'abc123\n'
      if (cmd.includes('rev-list --count')) return '0\n'
      if (cmd.includes('--name-only')) return '\n'
      if (cmd.includes('--stat')) return '\n'
      if (cmd.includes('--shortstat')) return '\n'
      return ''
    })

    const result = runPushDiffSummary()
    expect(result.commitCount).toBe(0)
    expect(result.fileCount).toBe(0)
  })

  it('uses custom baseBranch and remote', () => {
    const calls = []
    execSync.mockImplementation((cmd) => {
      calls.push(cmd)
      if (cmd.includes('merge-base')) return 'abc123\n'
      if (cmd.includes('rev-list --count')) return '1\n'
      if (cmd.includes('--name-only')) return 'file.js\n'
      if (cmd.includes('--stat')) return ' file.js | 1 +\n'
      if (cmd.includes('--shortstat')) return ' 1 file changed, 1 insertion(+)\n'
      return ''
    })

    runPushDiffSummary({ baseBranch: 'develop', remote: 'upstream' })

    expect(calls.some((c) => c.includes('upstream/develop'))).toBe(true)
  })
})
