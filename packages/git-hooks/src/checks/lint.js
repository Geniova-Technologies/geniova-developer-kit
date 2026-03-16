import { execSync } from 'node:child_process'
import { extname } from 'node:path'
import { logger } from '../utils/logger.js'
import { isEslintInstalled, hasProjectEslintConfig } from '../utils/config-resolver.js'
import { LINTABLE_EXTENSIONS, EXCLUDED_PATHS } from '../config/patterns.js'

/**
 * Check 1: Ejecuta ESLint (y Stylelint si disponible) sobre archivos staged.
 * @param {string[]} stagedFiles
 * @param {object} options
 * @param {string} [options.cwd]
 * @returns {Promise<{passed: boolean, errors: string[]}>}
 */
export async function runLintCheck(stagedFiles, { cwd = process.cwd() } = {}) {
  const errors = []

  const filteredFiles = stagedFiles.filter(
    (f) => !EXCLUDED_PATHS.some((ex) => f.includes(ex))
  )

  // ESLint
  const eslintFiles = filteredFiles.filter((f) =>
    LINTABLE_EXTENSIONS.eslint.includes(extname(f))
  )

  if (eslintFiles.length > 0) {
    if (!isEslintInstalled(cwd)) {
      logger.info('ESLint no está instalado — lint check omitido')
      return { passed: true, errors: [] }
    }

    const hasConfig = hasProjectEslintConfig(cwd)
    const configFlag = hasConfig ? '' : ' --no-eslintrc'

    try {
      const fileArgs = eslintFiles.map((f) => `"${f}"`).join(' ')
      execSync(`npx eslint ${fileArgs}${configFlag}`, {
        cwd,
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      logger.success(`ESLint: ${eslintFiles.length} archivo(s) sin errores`)
    } catch (err) {
      const output = err.stdout || err.stderr || ''
      errors.push(output)
      logger.error(`ESLint: errores encontrados en ${eslintFiles.length} archivo(s)`)
      if (output) {
        console.log(output)
      }
    }
  }

  // Stylelint
  const styleFiles = filteredFiles.filter((f) =>
    LINTABLE_EXTENSIONS.stylelint.includes(extname(f))
  )

  if (styleFiles.length > 0) {
    try {
      execSync('npx stylelint --version', { cwd, stdio: 'pipe' })
      const fileArgs = styleFiles.map((f) => `"${f}"`).join(' ')
      try {
        execSync(`npx stylelint ${fileArgs}`, {
          cwd,
          encoding: 'utf-8',
          stdio: 'pipe',
        })
        logger.success(`Stylelint: ${styleFiles.length} archivo(s) sin errores`)
      } catch (err) {
        const output = err.stdout || err.stderr || ''
        errors.push(output)
        logger.error(`Stylelint: errores encontrados`)
        if (output) {
          console.log(output)
        }
      }
    } catch {
      // Stylelint no instalado, skip silencioso
    }
  }

  if (eslintFiles.length === 0 && styleFiles.length === 0) {
    logger.info('Lint: sin archivos lintables en staged')
  }

  return { passed: errors.length === 0, errors }
}
