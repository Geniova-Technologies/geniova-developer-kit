#!/usr/bin/env node

/**
 * Hook pre-push: validates identity, rebase status, and shows diff summary.
 * Exit code 1 = blocks the push.
 */

import { execSync } from 'node:child_process'
import { resolveConfig } from '../utils/config-resolver.js'
import { logger } from '../utils/logger.js'
import { runPushIdentityCheck } from '../checks/push-identity.js'
import { runPushSshCheck } from '../checks/push-ssh.js'
import { runRebaseCheck } from '../checks/rebase-check.js'
import { runPushDiffSummary } from '../checks/push-diff-summary.js'

/**
 * Detect the current branch name.
 * @returns {string}
 */
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}

function main() {
  logger.heading('@geniova/git-hooks — pre-push')

  const config = resolveConfig()
  const branch = getCurrentBranch()
  let blocked = false

  if (!config.push.enabled) {
    logger.info('Push checks disabled')
    process.exit(0)
  }

  // Check 1: SSH
  if (config.push.requireSsh !== false) {
    logger.heading('Check 1/4: SSH remote')
    const sshResult = runPushSshCheck()
    if (!sshResult.passed) {
      blocked = true
    }
  }

  // Check 2: Identity
  logger.heading('Check 2/4: Push identity')
  const identityResult = runPushIdentityCheck({
    allowedEmails: config.push.allowedEmails,
  })
  if (!identityResult.passed) {
    blocked = true
  }

  // Check 3: Rebase (only on feat/fix branches)
  const isTrackedBranch = /^(feat|fix)\//.test(branch)
  if (config.push.rebaseCheck !== false && isTrackedBranch) {
    logger.heading('Check 3/4: Rebase status')
    const rebaseResult = runRebaseCheck({
      baseBranch: config.push.baseBranch || 'main',
      remote: config.push.remote || 'origin',
    })
    if (!rebaseResult.passed) {
      blocked = true
    }
  }

  // Check 4: Diff summary (only on feat/fix branches, informational)
  if (config.push.diffSummary !== false && isTrackedBranch) {
    logger.heading('Check 4/4: Diff summary')
    runPushDiffSummary({
      baseBranch: config.push.baseBranch || 'main',
      remote: config.push.remote || 'origin',
      maxLines: config.push.maxLines || 300,
    })
  }

  logger.blank()

  if (blocked) {
    logger.error('Push bloqueado — corrige los problemas antes de pushear')
    process.exit(1)
  }
}

try {
  main()
} catch (err) {
  logger.error(`Error inesperado: ${err.message}`)
  process.exit(0)
}
