import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock execSync before importing the module
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

const { execSync } = await import('node:child_process')
const { runPushIdentityCheck } = await import('../src/checks/push-identity.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('push-identity check', () => {
  it('pasa si no hay emails configurados (check omitido)', () => {
    const result = runPushIdentityCheck({ allowedEmails: [] })
    expect(result.passed).toBe(true)
  })

  it('pasa si el email coincide exactamente', () => {
    execSync.mockReturnValue('manu@geniova.com\n')
    const result = runPushIdentityCheck({ allowedEmails: ['manu@geniova.com'] })
    expect(result.passed).toBe(true)
    expect(result.email).toBe('manu@geniova.com')
  })

  it('pasa si el email coincide con wildcard de dominio', () => {
    execSync.mockReturnValue('manu@geniova.com\n')
    const result = runPushIdentityCheck({ allowedEmails: ['*@geniova.com'] })
    expect(result.passed).toBe(true)
  })

  it('falla si el email no coincide', () => {
    execSync.mockReturnValue('personal@gmail.com\n')
    const result = runPushIdentityCheck({ allowedEmails: ['*@geniova.com'] })
    expect(result.passed).toBe(false)
    expect(result.email).toBe('personal@gmail.com')
  })

  it('falla si git user.email está vacío', () => {
    execSync.mockReturnValue('\n')
    const result = runPushIdentityCheck({ allowedEmails: ['*@geniova.com'] })
    expect(result.passed).toBe(false)
  })

  it('falla si git config lanza error', () => {
    execSync.mockImplementation(() => { throw new Error('not set') })
    const result = runPushIdentityCheck({ allowedEmails: ['*@geniova.com'] })
    expect(result.passed).toBe(false)
  })

  it('la comparación es case-insensitive', () => {
    execSync.mockReturnValue('Manu@Geniova.COM\n')
    const result = runPushIdentityCheck({ allowedEmails: ['*@geniova.com'] })
    expect(result.passed).toBe(true)
  })

  it('soporta múltiples emails permitidos', () => {
    execSync.mockReturnValue('contractor@external.com\n')
    const result = runPushIdentityCheck({
      allowedEmails: ['*@geniova.com', 'contractor@external.com'],
    })
    expect(result.passed).toBe(true)
  })

  it('falla si no coincide con ninguno de los permitidos', () => {
    execSync.mockReturnValue('random@other.com\n')
    const result = runPushIdentityCheck({
      allowedEmails: ['*@geniova.com', 'contractor@external.com'],
    })
    expect(result.passed).toBe(false)
  })
})
