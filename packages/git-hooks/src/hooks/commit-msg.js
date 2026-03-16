#!/usr/bin/env node

/**
 * Hook commit-msg: valida que el mensaje de commit no contenga referencias a IA.
 * Exit code 1 = bloquea el commit.
 */

import { readFileSync } from 'node:fs'
import { resolveConfig } from '../utils/config-resolver.js'
import { logger } from '../utils/logger.js'
import { runCommitMsgNoAiCheck } from '../checks/commit-msg-no-ai.js'

function main() {
  logger.heading('@geniova/git-hooks — commit-msg')

  const config = resolveConfig()

  if (!config.commitMsg.enabled) {
    logger.info('Check de commit-msg deshabilitado')
    process.exit(0)
  }

  const msgFile = process.argv[2]
  if (!msgFile) {
    logger.error('No se recibió el archivo de mensaje de commit')
    process.exit(1)
  }

  const commitMessage = readFileSync(msgFile, 'utf-8')

  const extraPatterns = (config.commitMsg.extraPatterns ?? []).map((p) => new RegExp(p, 'i'))
  const result = runCommitMsgNoAiCheck(commitMessage, { extraPatterns })

  logger.blank()

  if (!result.passed) {
    logger.error('Commit bloqueado — elimina las referencias a IA del mensaje')
    process.exit(1)
  }

  logger.success('Mensaje de commit válido')
}

try {
  main()
} catch (err) {
  logger.error(`Error inesperado: ${err.message}`)
  // No bloquear el commit por errores internos del hook
  process.exit(0)
}
