import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyProtection } from '../../branch-protection/apply-protection.js';
import { logger } from '../../utils/logger.js';

const ORG = 'Geniova-Technologies';

/**
 * Initializes git (if needed), creates initial commit, pushes to origin,
 * and applies branch protection.
 * @param {import('./gather-info.js').ProjectSpec} spec
 * @param {string} targetDir - Absolute path to the project directory
 * @returns {boolean} true if commit + push succeeded
 */
export function initialCommit(spec, targetDir) {
  const gitDir = resolve(targetDir, '.git');

  // Init git if not already
  if (!existsSync(gitDir)) {
    try {
      execSync('git init', { cwd: targetDir, stdio: 'pipe' });
      execSync('git branch -M main', { cwd: targetDir, stdio: 'pipe' });
    } catch (err) {
      logger.error(`  No se pudo inicializar git: ${err.message}`);
      return false;
    }
  }

  // Stage and commit
  try {
    execSync('git add -A', { cwd: targetDir, stdio: 'pipe' });
    execSync('git commit -m "feat: initial project scaffold"', {
      cwd: targetDir,
      stdio: 'pipe',
    });
    logger.success('  Commit inicial creado.');
  } catch (err) {
    logger.error(`  No se pudo crear el commit inicial: ${err.message}`);
    return false;
  }

  // Push
  try {
    execSync('git push -u origin main', { cwd: targetDir, stdio: 'pipe' });
    logger.success('  Push a origin/main completado.');
  } catch (err) {
    logger.warn(`  No se pudo hacer push: ${err.message}`);
    logger.info('  Puedes hacer push manualmente: git push -u origin main');
  }

  // Branch protection
  const repoFullName = `${ORG}/${spec.name}`;
  try {
    applyProtection(repoFullName);
    logger.success('  Branch protection aplicada.');
  } catch (err) {
    logger.warn(`  No se pudo aplicar branch protection: ${err.message}`);
    logger.info('  Puedes aplicarla manualmente desde GitHub Settings > Branches.');
  }

  return true;
}
