import { execSync } from 'node:child_process'
import { logger } from '../utils/logger.js'

/**
 * Check: Muestra un resumen del diff que se va a pushear.
 * Informativo (nunca bloquea), pero avisa si el changeset es grande.
 *
 * @param {object} [options]
 * @param {string} [options.baseBranch] - Rama base (default: "main")
 * @param {string} [options.remote] - Remote (default: "origin")
 * @param {number} [options.maxLines] - Umbral de líneas para warning (default: 300)
 * @returns {{commitCount: number, fileCount: number, linesChanged: number, files: string[]}}
 */
export function runPushDiffSummary({ baseBranch = 'main', remote = 'origin', maxLines = 300 } = {}) {
  const remoteRef = `${remote}/${baseBranch}`
  const result = { commitCount: 0, fileCount: 0, linesChanged: 0, files: [] }

  // Find merge-base
  let mergeBase
  try {
    mergeBase = execSync(`git merge-base HEAD ${remoteRef}`, { encoding: 'utf-8' }).trim()
  } catch {
    logger.warn('Could not determine merge-base — skipping diff summary')
    return result
  }

  // Count commits
  try {
    result.commitCount = parseInt(
      execSync(`git rev-list --count ${mergeBase}..HEAD`, { encoding: 'utf-8' }).trim(),
      10
    )
  } catch {
    // Non-critical
  }

  // Get changed files
  try {
    const output = execSync(`git diff --name-only ${mergeBase}..HEAD`, { encoding: 'utf-8' }).trim()
    result.files = output ? output.split('\n').filter(Boolean) : []
    result.fileCount = result.files.length
  } catch {
    // Non-critical
  }

  // Get stat summary
  try {
    const stat = execSync(`git diff --stat ${mergeBase}..HEAD`, { encoding: 'utf-8' }).trim()
    if (stat) {
      logger.detail('Commits', String(result.commitCount))
      logger.detail('Files changed', String(result.fileCount))
      logger.blank()
      for (const line of stat.split('\n')) {
        logger.dim(line)
      }
      logger.blank()
    }
  } catch {
    // Non-critical
  }

  // Count lines changed
  try {
    const shortstat = execSync(`git diff --shortstat ${mergeBase}..HEAD`, { encoding: 'utf-8' }).trim()
    const numbers = shortstat.match(/(\d+) insertion|(\d+) deletion/g)
    if (numbers) {
      result.linesChanged = numbers.reduce((sum, match) => {
        const n = match.match(/(\d+)/)?.[1]
        return sum + (n ? parseInt(n, 10) : 0)
      }, 0)
    }
  } catch {
    // Non-critical
  }

  // Warn if changeset is large
  if (result.linesChanged > maxLines) {
    logger.warn(`Large changeset: ~${result.linesChanged} lines changed (recommended <${maxLines} per PR)`)
    logger.blank()
  }

  return result
}
