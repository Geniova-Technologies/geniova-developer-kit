import { execSync } from 'node:child_process'
import { logger } from '../utils/logger.js'

/**
 * Check: Verifica que la rama actual está rebaseada sobre origin/main.
 * Bloquea el push si hay commits en origin/main que no están en la rama.
 *
 * @param {object} [options]
 * @param {string} [options.baseBranch] - Rama base (default: "main")
 * @param {string} [options.remote] - Remote (default: "origin")
 * @returns {{passed: boolean, behindCount: number, missingCommits: string[], reason?: string}}
 */
export function runRebaseCheck({ baseBranch = 'main', remote = 'origin' } = {}) {
  const remoteRef = `${remote}/${baseBranch}`

  // Fetch latest from remote
  try {
    execSync(`git fetch ${remote} ${baseBranch} --quiet`, { encoding: 'utf-8', stdio: 'pipe' })
  } catch {
    logger.warn(`Could not fetch ${remoteRef} — skipping rebase check`)
    return { passed: true, behindCount: 0, missingCommits: [] }
  }

  // Get current branch
  let branch
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    logger.warn('Could not determine current branch')
    return { passed: true, behindCount: 0, missingCommits: [] }
  }

  // Count commits on remote/base that are NOT in current branch
  let behindCount
  try {
    behindCount = parseInt(
      execSync(`git rev-list --count ${branch}..${remoteRef}`, { encoding: 'utf-8' }).trim(),
      10
    )
  } catch {
    logger.warn(`Could not compare ${branch} with ${remoteRef}`)
    return { passed: true, behindCount: 0, missingCommits: [] }
  }

  if (behindCount === 0) {
    logger.success(`Branch is up to date with ${remoteRef}`)
    return { passed: true, behindCount: 0, missingCommits: [] }
  }

  // Get the missing commits for display
  let missingCommits = []
  try {
    const log = execSync(`git log --oneline ${branch}..${remoteRef}`, { encoding: 'utf-8' }).trim()
    missingCommits = log ? log.split('\n') : []
  } catch {
    // Non-critical
  }

  logger.error(`Branch is ${behindCount} commit(s) behind ${remoteRef}`)
  logger.blank()
  logger.warn('Someone pushed to main while you were working.')
  logger.warn('You MUST rebase before pushing to avoid overwriting their changes.')
  logger.blank()

  if (missingCommits.length > 0) {
    logger.info(`Commits on ${remoteRef} that you're missing:`)
    for (const commit of missingCommits) {
      logger.dim(commit)
    }
    logger.blank()
  }

  logger.info('Run:')
  logger.dim(`git fetch ${remote} ${baseBranch}`)
  logger.dim(`git rebase ${remoteRef}`)
  logger.dim('# resolve conflicts if any, then push again')

  return {
    passed: false,
    behindCount,
    missingCommits,
    reason: `Branch is ${behindCount} commit(s) behind ${remoteRef}`,
  }
}
