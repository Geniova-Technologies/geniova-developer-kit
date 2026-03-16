import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { logger } from '../utils/logger.js';

/**
 * Installs git hooks and generates AI agent guidelines using @geniova/git-hooks.
 * Delegates to `npx @geniova/git-hooks init` which:
 *   - Installs Husky with pre-commit, commit-msg, and pre-push hooks
 *   - Generates guidelines for all AI agents (CLAUDE.md, AGENTS.md, copilot, gemini, cursor)
 *   - Installs no-ai-refs GitHub Action
 * @param {import('../catalog/projects.js').Project} _project
 * @param {string} targetDir - Absolute path to the project directory
 */
export async function setupGitHooks(_project, targetDir) {
  if (!existsSync(resolve(targetDir, '.git'))) {
    logger.warn(
      'No se encontro directorio .git. Asegurate de que el proyecto este inicializado con git.'
    );
    return;
  }

  logger.info('Instalando hooks y guidelines via @geniova/git-hooks...');

  try {
    execSync('npx @geniova/git-hooks init', {
      cwd: targetDir,
      stdio: 'inherit',
    });
  } catch {
    logger.warn(
      'No se pudo ejecutar @geniova/git-hooks init. Instalalo manualmente: npx @geniova/git-hooks init'
    );
  }
}
