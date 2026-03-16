import { selectProject } from './steps/select-project.js';
import { cloneRepo } from './steps/clone-repo.js';
import { installDeps } from './steps/install-deps.js';
import { setupMCPs } from './steps/setup-mcps.js';
import { setupGitHooks } from './steps/setup-git-hooks.js';
import { generateConfig } from './steps/generate-config.js';
import { logger } from './utils/logger.js';

/**
 * Main wizard function.
 * Runs each step sequentially: select project, clone repo, install deps,
 * setup MCPs, setup git hooks, generate config, and show summary.
 */
export async function main() {
  logger.info('');
  logger.info('==============================================');
  logger.info('  Geniova Kit - Wizard de configuracion');
  logger.info('==============================================');
  logger.info('');

  const totalSteps = 6;

  // Step 1: Select project
  logger.step(1, totalSteps, 'Seleccionar proyecto');
  const project = await selectProject();
  if (!project) {
    logger.warn('No se selecciono ningun proyecto. Saliendo.');
    return;
  }
  logger.success(`Proyecto seleccionado: ${project.name}`);
  logger.info('');

  // Step 2: Clone repo
  logger.step(2, totalSteps, 'Clonar repositorio');
  const targetDir = await cloneRepo(project);
  if (!targetDir) {
    logger.warn('Clonado cancelado. Saliendo.');
    return;
  }
  logger.success(`Repositorio clonado en: ${targetDir}`);
  logger.info('');

  // Step 3: Install dependencies
  logger.step(3, totalSteps, 'Instalar dependencias');
  await installDeps(project, targetDir);
  logger.success('Dependencias instaladas.');
  logger.info('');

  // Step 4: Setup MCPs
  logger.step(4, totalSteps, 'Configurar MCPs');
  await setupMCPs(project, targetDir);
  logger.success('MCPs configurados.');
  logger.info('');

  // Step 5: Setup git hooks + AI agent guidelines
  logger.step(5, totalSteps, 'Configurar hooks y guidelines');
  await setupGitHooks(project, targetDir);
  logger.success('Hooks y guidelines instalados.');
  logger.info('');

  // Step 6: Generate config files (.env)
  logger.step(6, totalSteps, 'Generar ficheros de configuracion');
  await generateConfig(project, targetDir);
  logger.success('Ficheros de configuracion generados.');
  logger.info('');

  // Summary
  showSummary(project, targetDir);
}

/**
 * Displays a summary of the wizard results.
 * @param {import('./catalog/projects.js').Project} project
 * @param {string} targetDir
 */
function showSummary(project, targetDir) {
  logger.info('==============================================');
  logger.success('  Configuracion completada!');
  logger.info('==============================================');
  logger.info('');
  logger.info(`  Proyecto:   ${project.name} (${project.abbreviation})`);
  logger.info(`  Directorio: ${targetDir}`);
  logger.info(`  Stack:      ${project.stack}`);
  logger.info('');
  logger.info('  Proximos pasos:');
  logger.info(`    cd ${targetDir}`);
  logger.info('    Revisa el fichero .env y completa los valores');
  logger.info('    Revisa CLAUDE.md para las instrucciones del proyecto');
  logger.info('');
}
