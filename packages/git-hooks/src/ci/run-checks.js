#!/usr/bin/env node

/**
 * Entry point para CI: ejecuta checks sobre el diff de un PR.
 *
 * Env vars esperadas:
 *   GITHUB_BASE_REF - rama base del PR (ej: main)
 *   GITHUB_HEAD_REF - rama head del PR
 *   GITHUB_EVENT_PATH - path al evento JSON de GitHub Actions
 *   GENIOVA_HOOKS_* - configuración opcional
 *
 * También acepta diff por stdin o como argumento --diff-file=<path>.
 */

import { readFileSync } from 'node:fs'
import { getDiffBetween, getChangedFilesBetween, parseDiff } from '../utils/git.js'
import { resolveConfig } from '../utils/config-resolver.js'
import { logger } from '../utils/logger.js'
import { runLintCheck } from '../checks/lint.js'
import { runRegressionCheck } from '../checks/regression.js'
import { runNoAiRefsCheck } from '../checks/no-ai-refs.js'

async function main() {
  logger.heading('@geniova/git-hooks — CI checks')

  const config = resolveConfig()
  let diff = ''
  let changedFiles = []

  // Obtener diff: de file, de env vars, o de GitHub refs
  const diffFileArg = process.argv.find((a) => a.startsWith('--diff-file='))
  if (diffFileArg) {
    diff = readFileSync(diffFileArg.split('=')[1], 'utf-8')
    changedFiles = parseDiff(diff).map((f) => f.file)
  } else {
    const base = process.env.GITHUB_BASE_REF ?? 'origin/main'
    const head = process.env.GITHUB_HEAD_REF ?? 'HEAD'
    try {
      diff = getDiffBetween(base, head)
      changedFiles = getChangedFilesBetween(base, head)
    } catch (err) {
      logger.error(`No se pudo obtener el diff: ${err.message}`)
      process.exit(1)
    }
  }

  if (!diff) {
    logger.info('Sin cambios detectados')
    process.exit(0)
  }

  logger.info(`${changedFiles.length} archivo(s) cambiados`)

  const results = { lint: null, regression: null, aiRefs: null }

  // Determinar qué checks ejecutar
  const checksArg = process.argv.find((a) => a.startsWith('--check='))
  const requestedCheck = checksArg ? checksArg.split('=')[1] : null

  // Check 1: Lint
  if (config.lint.enabled && (!requestedCheck || requestedCheck === 'lint')) {
    logger.heading('Check: Lint')
    results.lint = await runLintCheck(changedFiles)
  }

  // Check 2: Regresiones
  if (config.regression.enabled && (!requestedCheck || requestedCheck === 'regression')) {
    logger.heading('Check: Regresiones')
    results.regression = await runRegressionCheck(diff, {
      historyDepth: config.historyDepth,
      maxFiles: config.regression.maxFiles,
    })
  }

  // Check 3: AI refs
  if (config.aiRefs.enabled && (!requestedCheck || requestedCheck === 'ai-refs')) {
    logger.heading('Check: Referencias a IA')
    const extraPatterns = (config.aiRefs.extraPatterns ?? []).map((p) => new RegExp(p, 'i'))
    results.aiRefs = runNoAiRefsCheck(diff, {
      extraPatterns,
      allowInFiles: config.aiRefs.allowInFiles,
    })
  }

  // Output JSON para CI
  if (process.env.CI) {
    const summary = {
      lint: results.lint ? { passed: results.lint.passed } : null,
      regression: results.regression
        ? { warnings: results.regression.warnings.length }
        : null,
      aiRefs: results.aiRefs ? { passed: results.aiRefs.passed, matches: results.aiRefs.matches.length } : null,
    }
    console.log(`\n::set-output name=results::${JSON.stringify(summary)}`)
  }

  const hasBlockingErrors =
    (results.lint && !results.lint.passed) ||
    (results.aiRefs && !results.aiRefs.passed)

  if (hasBlockingErrors) {
    process.exit(1)
  }
}

main().catch((err) => {
  logger.error(`Error: ${err.message}`)
  process.exit(1)
})
