#!/usr/bin/env node

/**
 * Orquestador pre-commit: ejecuta los 3 checks en orden.
 * Exit code 1 = bloquea el commit.
 */

import { getStagedFiles, getStagedDiff } from '../utils/git.js'
import { resolveConfig } from '../utils/config-resolver.js'
import { logger } from '../utils/logger.js'
import { runLintCheck } from '../checks/lint.js'
import { runRegressionCheck } from '../checks/regression.js'
import { runNoAiRefsCheck } from '../checks/no-ai-refs.js'
import { runStripComments } from '../checks/strip-comments.js'

async function main() {
  logger.heading('@geniova/git-hooks — pre-commit')

  const config = resolveConfig()
  let stagedFiles = getStagedFiles()

  if (stagedFiles.length === 0) {
    logger.info('Sin archivos staged — nada que verificar')
    process.exit(0)
  }

  logger.info(`${stagedFiles.length} archivo(s) staged`)

  let hasBlockingErrors = false

  // Check 0: Strip comments (modifica ficheros, debe ir antes de lint)
  if (config.stripComments?.enabled !== false) {
    logger.heading('Strip comments')
    runStripComments(stagedFiles)
    stagedFiles = getStagedFiles()
  }

  // Check 1: Lint
  if (config.lint.enabled) {
    logger.heading('Check 1/3: Lint')
    const lintResult = await runLintCheck(stagedFiles)
    if (!lintResult.passed) {
      hasBlockingErrors = true
    }
  }

  // Check 2: Regresiones (WARNING only)
  if (config.regression.enabled) {
    logger.heading('Check 2/3: Regresiones')
    const diff = getStagedDiff()
    await runRegressionCheck(diff, {
      historyDepth: config.historyDepth,
      maxFiles: config.regression.maxFiles,
    })
  }

  // Check 3: No AI refs
  if (config.aiRefs.enabled) {
    logger.heading('Check 3/3: Referencias a IA')
    const diff = getStagedDiff()
    const extraPatterns = (config.aiRefs.extraPatterns ?? []).map((p) => new RegExp(p, 'i'))
    const aiResult = runNoAiRefsCheck(diff, {
      extraPatterns,
      allowInFiles: config.aiRefs.allowInFiles,
    })
    if (!aiResult.passed) {
      hasBlockingErrors = true
    }
  }

  logger.blank()

  if (hasBlockingErrors) {
    logger.error('Commit bloqueado — corrige los errores antes de commitear')
    process.exit(1)
  }

  logger.success('Todos los checks pasaron')
}

main().catch((err) => {
  logger.error(`Error inesperado: ${err.message}`)
  // No bloquear el commit por errores internos del hook
  process.exit(0)
})
