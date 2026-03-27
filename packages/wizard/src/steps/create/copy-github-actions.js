import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(__dirname, '../../../templates/github-actions');

const TEST_COMMANDS = {
  'astro-lit': 'pnpm test',
  next: 'pnpm test',
  node: 'pnpm test',
};

/**
 * Resolves the test command placeholder in ci.yml based on stack.
 * @param {string} stack
 * @returns {string}
 */
export function resolveTestCommand(stack) {
  return TEST_COMMANDS[stack] || 'pnpm test';
}

/**
 * Copies all GitHub Actions workflow templates to the target project.
 * Replaces {{TEST_COMMAND}} in ci.yml with the appropriate test command.
 * @param {import('./gather-info.js').ProjectSpec} spec
 * @param {string} targetDir - Absolute path to the project directory
 * @returns {boolean} true if all workflows were copied
 */
export function copyGitHubActions(spec, targetDir) {
  const workflowsDir = resolve(targetDir, '.github', 'workflows');

  if (!existsSync(workflowsDir)) {
    mkdirSync(workflowsDir, { recursive: true });
  }

  if (!existsSync(TEMPLATES_DIR)) {
    logger.error('  No se encontraron templates de GitHub Actions.');
    return false;
  }

  const templates = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.yml'));
  let copied = 0;

  for (const file of templates) {
    try {
      let content = readFileSync(resolve(TEMPLATES_DIR, file), 'utf-8');

      if (file === 'ci.yml') {
        content = content.replace('{{TEST_COMMAND}}', resolveTestCommand(spec.stack));
      }

      writeFileSync(resolve(workflowsDir, file), content);
      copied++;
    } catch (err) {
      logger.warn(`  No se pudo copiar ${file}: ${err.message}`);
    }
  }

  logger.success(`  ${copied} GitHub Actions copiadas a .github/workflows/`);
  return copied > 0;
}
