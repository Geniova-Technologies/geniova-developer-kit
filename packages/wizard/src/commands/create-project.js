import { commandExists } from '../utils/system.js';
import { logger } from '../utils/logger.js';
import { gatherProjectInfo } from '../steps/create/gather-info.js';
import { createRepo } from '../steps/create/create-repo.js';
import { scaffoldProject } from '../steps/create/scaffold-project.js';
import { copyGitHubActions } from '../steps/create/copy-github-actions.js';
import { initialCommit } from '../steps/create/initial-commit.js';
import { printNextSteps } from '../steps/create/print-next-steps.js';
import { setupGitHooks } from '../steps/setup-git-hooks.js';
import { generateProjectMCPConfig } from '../steps/setup-mcps.js';

const TOTAL_STEPS = 7;

/**
 * Orchestrates the creation of a new Geniova project from scratch.
 * Steps: gather info → create repo → scaffold → git hooks → MCPs →
 *        GitHub Actions → initial commit + push + branch protection
 */
export async function createProject() {
  logger.info('\n  Geniova Kit — Crear nuevo proyecto\n');

  // Prerequisites
  if (!commandExists('gh')) {
    logger.error('Requisito: gh CLI no esta instalado. Instala: https://cli.github.com');
    process.exit(1);
  }
  if (!commandExists('pnpm')) {
    logger.error('Requisito: pnpm no esta instalado. Instala: npm i -g pnpm');
    process.exit(1);
  }
  if (!commandExists('git')) {
    logger.error('Requisito: git no esta instalado.');
    process.exit(1);
  }

  // Step 1: Gather info
  logger.step(1, TOTAL_STEPS, 'Recoger datos del proyecto');
  const spec = await gatherProjectInfo();
  if (!spec) {
    logger.warn('  Creacion cancelada por el usuario.');
    return;
  }

  // Step 2: Create repo
  logger.step(2, TOTAL_STEPS, 'Crear repositorio en GitHub');
  const targetDir = await createRepo(spec);
  if (!targetDir) {
    logger.error('  No se pudo crear/clonar el repositorio. Abortando.');
    return;
  }

  // Step 3: Scaffold
  logger.step(3, TOTAL_STEPS, `Scaffold ${spec.stack}`);
  const scaffoldOk = await scaffoldProject(spec, targetDir);
  if (!scaffoldOk) {
    logger.warn('  Scaffold fallo. El repo existe pero esta vacio.');
    logger.info('  Puedes crear el scaffold manualmente y continuar.');
    return;
  }

  // Step 4: Git hooks + guidelines
  logger.step(4, TOTAL_STEPS, 'Instalar git hooks y guidelines');
  await setupGitHooks(null, targetDir);

  // Step 5: MCP config
  logger.step(5, TOTAL_STEPS, 'Configurar MCPs (.claude/settings.json)');
  const pseudoProject = {
    mcpsRequired: ['planning-game', 'karajan'],
    mcpsOptional: ['chrome-devtools', 'sonarqube'],
  };
  generateProjectMCPConfig(pseudoProject, targetDir);

  // Step 6: GitHub Actions
  logger.step(6, TOTAL_STEPS, 'Copiar GitHub Actions');
  copyGitHubActions(spec, targetDir);

  // Step 7: Initial commit + push + branch protection
  logger.step(7, TOTAL_STEPS, 'Commit inicial, push y branch protection');
  initialCommit(spec, targetDir);

  // Summary
  printNextSteps(spec, targetDir);
}
