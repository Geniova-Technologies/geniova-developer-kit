import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

const { execSync } = await import('node:child_process')
const { runPushSshCheck } = await import('../src/checks/push-ssh.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('push-ssh check', () => {
  it('pasa si el remote usa SSH (git@)', () => {
    execSync.mockReturnValue('git@github.com:Geniova-Technologies/repo.git\n')
    const result = runPushSshCheck()
    expect(result.passed).toBe(true)
    expect(result.url).toBe('git@github.com:Geniova-Technologies/repo.git')
  })

  it('bloquea si el remote usa HTTPS', () => {
    execSync.mockReturnValue('https://github.com/Geniova-Technologies/repo.git\n')
    const result = runPushSshCheck()
    expect(result.passed).toBe(false)
    expect(result.reason).toContain('HTTPS')
    expect(result.reason).toContain('git@github.com:Geniova-Technologies/repo.git')
  })

  it('bloquea si el remote usa HTTP (sin S)', () => {
    execSync.mockReturnValue('http://github.com/Geniova-Technologies/repo.git\n')
    const result = runPushSshCheck()
    expect(result.passed).toBe(false)
  })

  it('pasa si el remote no existe (check omitido)', () => {
    execSync.mockImplementation(() => { throw new Error('not found') })
    const result = runPushSshCheck()
    expect(result.passed).toBe(true)
  })

  it('pasa si el remote URL está vacía', () => {
    execSync.mockReturnValue('\n')
    const result = runPushSshCheck()
    expect(result.passed).toBe(true)
  })

  it('soporta remote personalizado', () => {
    execSync.mockReturnValue('git@gitlab.com:Org/repo.git\n')
    const result = runPushSshCheck({ remote: 'upstream' })
    expect(result.passed).toBe(true)
    expect(execSync).toHaveBeenCalledWith('git remote get-url upstream', { encoding: 'utf-8' })
  })

  it('sugiere la URL SSH correcta al bloquear', () => {
    execSync.mockReturnValue('https://gitlab.com/Org/repo.git\n')
    const result = runPushSshCheck()
    expect(result.passed).toBe(false)
    expect(result.reason).toContain('git@gitlab.com:Org/repo.git')
  })

  it('pasa con URLs SSH de GitLab', () => {
    execSync.mockReturnValue('git@gitlab.com:Geniova/project.git\n')
    const result = runPushSshCheck()
    expect(result.passed).toBe(true)
  })
})
