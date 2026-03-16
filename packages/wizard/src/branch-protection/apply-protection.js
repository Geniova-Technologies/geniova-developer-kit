/**
 * Branch protection utilities.
 * Uses the GitHub CLI (`gh api`) to apply branch protection rules
 * to repositories in a GitHub organization.
 *
 * @module apply-protection
 */

import { execSync } from 'node:child_process';

/** @typedef {{ requirePR: boolean, requiredApprovals: number, dismissStaleReviews: boolean, noPushToMain: boolean, noDeleteBranch: boolean }} ProtectionOptions */
/** @typedef {{ dryRun: boolean, branch: string }} ApplyOptions */

const DEFAULT_PROTECTION_OPTIONS = {
  requirePR: true,
  requiredApprovals: 1,
  dismissStaleReviews: true,
  noPushToMain: true,
  noDeleteBranch: true,
};

const DEFAULT_APPLY_OPTIONS = {
  dryRun: false,
  branch: 'main',
};

/**
 * Build the branch protection payload for the GitHub API.
 *
 * @param {ProtectionOptions} options
 * @returns {object} GitHub API request body
 */
const buildProtectionPayload = (options) => {
  const opts = { ...DEFAULT_PROTECTION_OPTIONS, ...options };

  return {
    required_pull_request_reviews: opts.requirePR
      ? {
          required_approving_review_count: opts.requiredApprovals,
          dismiss_stale_reviews: opts.dismissStaleReviews,
        }
      : null,
    enforce_admins: opts.noPushToMain,
    required_status_checks: null,
    restrictions: null,
    allow_deletions: !opts.noDeleteBranch,
    allow_force_pushes: false,
  };
};

/**
 * Execute a gh CLI command and return stdout.
 *
 * @param {string} cmd
 * @returns {string}
 */
const execGh = (cmd) => execSync(cmd, { encoding: 'utf-8' }).trim();

/**
 * Apply branch protection rules to a single repository.
 *
 * @param {string} repo  Full repo name (org/repo)
 * @param {Partial<ProtectionOptions & ApplyOptions>} options
 * @returns {{ repo: string, branch: string, applied: boolean, payload: object }}
 */
export const applyProtection = (repo, options = {}) => {
  const { dryRun, branch, ...protectionOpts } = {
    ...DEFAULT_APPLY_OPTIONS,
    ...options,
  };

  const payload = buildProtectionPayload(protectionOpts);

  if (dryRun) {
    console.log(`[DRY-RUN] Would apply to ${repo} (branch: ${branch}):`);
    console.log(JSON.stringify(payload, null, 2));
    return { repo, branch, applied: false, payload };
  }

  const payloadJson = JSON.stringify(payload);

  execGh(
    `gh api repos/${repo}/branches/${branch}/protection ` +
      `--method PUT ` +
      `--input - <<< '${payloadJson}'`
  );

  console.log(`Applied branch protection to ${repo} (branch: ${branch})`);
  return { repo, branch, applied: true, payload };
};

/**
 * Apply branch protection to ALL repositories of an organization.
 *
 * @param {string} org           GitHub organization name
 * @param {Partial<ProtectionOptions & ApplyOptions>} options
 * @returns {{ total: number, applied: number, skipped: number, errors: string[] }}
 */
export const applyProtectionToAll = (org, options = {}) => {
  const repoListRaw = execGh(
    `gh repo list ${org} --limit 200 --json nameWithOwner --jq '.[].nameWithOwner'`
  );

  const repos = repoListRaw
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

  const results = { total: repos.length, applied: 0, skipped: 0, errors: [] };

  for (const repo of repos) {
    try {
      const result = applyProtection(repo, options);
      if (result.applied) {
        results.applied++;
      } else {
        results.skipped++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error applying protection to ${repo}: ${message}`);
      results.errors.push(`${repo}: ${message}`);
    }
  }

  console.log(
    `\nDone: ${results.applied} applied, ${results.skipped} skipped, ${results.errors.length} errors out of ${results.total} repos`
  );

  return results;
};
