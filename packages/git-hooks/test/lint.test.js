import { describe, it, expect, vi } from 'vitest'
import { runLintCheck } from '../src/checks/lint.js'

// Mock config-resolver para controlar si ESLint está instalado
vi.mock('../src/utils/config-resolver.js', () => ({
  isEslintInstalled: vi.fn(),
  hasProjectEslintConfig: vi.fn(),
}))

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

import { isEslintInstalled, hasProjectEslintConfig } from '../src/utils/config-resolver.js'
import { execSync } from 'node:child_process'

import { beforeEach } from 'vitest'

describe('lint check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skip si ESLint no está instalado', async () => {
    isEslintInstalled.mockReturnValue(false)

    const result = await runLintCheck(['src/index.js'])
    expect(result.passed).toBe(true)
  })

  it('pasa si ESLint no encuentra errores', async () => {
    isEslintInstalled.mockReturnValue(true)
    hasProjectEslintConfig.mockReturnValue(true)
    execSync.mockReturnValue('')

    const result = await runLintCheck(['src/index.js'])
    expect(result.passed).toBe(true)
  })

  it('falla si ESLint encuentra errores', async () => {
    isEslintInstalled.mockReturnValue(true)
    hasProjectEslintConfig.mockReturnValue(true)

    const eslintError = new Error('ESLint error')
    eslintError.stdout = 'src/index.js: Unexpected var (no-var)'
    execSync.mockImplementation(() => {
      throw eslintError
    })

    const result = await runLintCheck(['src/index.js'])
    expect(result.passed).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  it('ignora archivos no lintables', async () => {
    isEslintInstalled.mockReturnValue(true)

    const result = await runLintCheck(['image.png', 'data.csv'])
    // No se llama a ESLint si no hay archivos lintables
    expect(result.passed).toBe(true)
  })

  it('filtra archivos en node_modules', async () => {
    isEslintInstalled.mockReturnValue(true)

    const result = await runLintCheck(['node_modules/pkg/index.js'])
    expect(result.passed).toBe(true)
  })

  it('usa flag --no-eslintrc si no hay config del proyecto', async () => {
    isEslintInstalled.mockReturnValue(true)
    hasProjectEslintConfig.mockReturnValue(false)
    execSync.mockReturnValue('')

    await runLintCheck(['src/index.js'])
    const call = execSync.mock.calls.find((c) => c[0].includes('eslint'))
    expect(call[0]).toContain('--no-eslintrc')
  })
})
