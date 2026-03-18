import { existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

const CONFIG_FILENAME = '.githooksrc.json'

const DEFAULT_CONFIG = {
  historyDepth: 10,
  lint: { enabled: true },
  regression: { enabled: true, maxFiles: 20 },
  aiRefs: { enabled: true, extraPatterns: [], allowInFiles: ['.claude/*'] },
  commitMsg: { enabled: true, extraPatterns: [] },
  push: { enabled: true, allowedEmails: [], rebaseCheck: true, diffSummary: true, baseBranch: 'main', remote: 'origin', maxLines: 300 },
  stripComments: { enabled: true },
}

/**
 * Busca y carga la configuración del proyecto.
 * Prioridad: env vars > .githooksrc.json > defaults.
 * @param {string} [cwd]
 * @returns {typeof DEFAULT_CONFIG}
 */
export function resolveConfig(cwd = process.cwd()) {
  let fileConfig = {}

  const configPath = resolve(cwd, CONFIG_FILENAME)
  if (existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
    } catch {
      // Config inválida, usar defaults
    }
  }

  const config = deepMerge(DEFAULT_CONFIG, fileConfig)

  // Override con env vars
  if (process.env.GENIOVA_HOOKS_HISTORY_DEPTH) {
    config.historyDepth = parseInt(process.env.GENIOVA_HOOKS_HISTORY_DEPTH, 10)
  }
  if (process.env.GENIOVA_HOOKS_LINT_ENABLED === 'false') {
    config.lint.enabled = false
  }
  if (process.env.GENIOVA_HOOKS_REGRESSION_ENABLED === 'false') {
    config.regression.enabled = false
  }
  if (process.env.GENIOVA_HOOKS_REGRESSION_MAX_FILES) {
    config.regression.maxFiles = parseInt(process.env.GENIOVA_HOOKS_REGRESSION_MAX_FILES, 10)
  }
  if (process.env.GENIOVA_HOOKS_AIREFS_ENABLED === 'false') {
    config.aiRefs.enabled = false
  }
  if (process.env.GENIOVA_HOOKS_COMMITMSG_ENABLED === 'false') {
    config.commitMsg.enabled = false
  }
  if (process.env.GENIOVA_HOOKS_PUSH_ENABLED === 'false') {
    config.push.enabled = false
  }
  if (process.env.GENIOVA_HOOKS_PUSH_REBASE_CHECK === 'false') {
    config.push.rebaseCheck = false
  }
  if (process.env.GENIOVA_HOOKS_PUSH_DIFF_SUMMARY === 'false') {
    config.push.diffSummary = false
  }
  if (process.env.GENIOVA_HOOKS_PUSH_MAX_LINES) {
    config.push.maxLines = parseInt(process.env.GENIOVA_HOOKS_PUSH_MAX_LINES, 10)
  }
  if (process.env.GENIOVA_HOOKS_STRIP_COMMENTS_ENABLED === 'false') {
    config.stripComments.enabled = false
  }

  return config
}

/**
 * Detecta si el proyecto tiene una configuración ESLint propia.
 * @param {string} [cwd]
 * @returns {boolean}
 */
export function hasProjectEslintConfig(cwd = process.cwd()) {
  const eslintConfigs = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    '.eslintrc.json',
    '.eslintrc.js',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    '.eslintrc',
  ]
  return eslintConfigs.some((name) => existsSync(join(cwd, name)))
}

/**
 * Detecta si eslint está instalado.
 * @param {string} [cwd]
 * @returns {boolean}
 */
export function isEslintInstalled(cwd = process.cwd()) {
  try {
    const pkgPath = join(cwd, 'node_modules', 'eslint', 'package.json')
    return existsSync(pkgPath)
  } catch {
    return false
  }
}

/**
 * Deep merge de dos objetos (2 niveles).
 * @param {Record<string, any>} target
 * @param {Record<string, any>} source
 * @returns {Record<string, any>}
 */
function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object'
    ) {
      result[key] = { ...target[key], ...source[key] }
    } else {
      result[key] = source[key]
    }
  }
  return result
}
