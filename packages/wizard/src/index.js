import { checkPrerequisites } from './steps/check-prerequisites.js';
import { selectProject } from './steps/select-project.js';
import { cloneRepo } from './steps/clone-repo.js';
import { installDeps } from './steps/install-deps.js';
import { installGlobalMCPs, generateProjectMCPConfig } from './steps/setup-mcps.js';
import { setupGitHooks } from './steps/setup-git-hooks.js';
import { generateConfig } from './steps/generate-config.js';
import { commandExists } from './utils/system.js';
import { confirm } from './utils/prompt.js';
import { logger } from './utils/logger.js';

/**
 * Main wizard function.
 * Phase 1: Global setup (prerequisites + MCPs) — run once.
 * Phase 2: Project setup (clone, deps, hooks, config) — loop per project.
 */
export async function main() {
  logger.info('');
  logger.info('==============================================');
  logger.info('  Geniova Kit - Wizard de configuracion');
  logger.info('==============================================');
  logger.info('');

  // ── Phase 1: Global setup ──
  logger.info('── Fase 1: Configuracion global ──');
  logger.info('');

  // Step 1: Check prerequisites
  logger.step(1, 2, 'Verificar prerequisitos');
  const ready = await checkPrerequisites();
  if (!ready) {
    logger.error('Prerequisitos no cumplidos. Saliendo.');
    return;
  }
  logger.success('Prerequisitos verificados.');
  logger.info('');

  // Step 2: Setup MCPs (user-level, global)
  logger.step(2, 2, 'Configurar MCPs (nivel usuario)');
  if (commandExists('claude')) {
    await installGlobalMCPs();
    logger.success('MCPs configurados a nivel usuario.');
  } else {
    logger.warn('Claude Code no detectado. Saltando configuracion de MCPs.');
    logger.info('  Los MCPs son exclusivos de Claude Code.');
    logger.info('  Si lo instalas en el futuro, ejecuta el wizard de nuevo.');
  }
  logger.info('');

  // ── Phase 2: Project setup (loop) ──
  logger.info('── Fase 2: Configuracion por proyecto ──');
  logger.info('');

  const configuredProjects = [];

  while (true) {
    const wantProject = await confirm(
      'Configurar un proyecto?',
      configuredProjects.length === 0
    );
    if (!wantProject) break;

    const result = await setupProject();
    if (result) {
      configuredProjects.push(result);
    }

    logger.info('');
  }

  // Summary
  showSummary(configuredProjects);
}

/**
 * Sets up a single project: select, clone, deps, hooks, config.
 * @returns {Promise<{project: import('./catalog/projects.js').Project, dir: string}|null>}
 */
async function setupProject() {
  const totalSteps = 4;

  // Step 1: Select project
  logger.step(1, totalSteps, 'Seleccionar proyecto');
  const project = await selectProject();
  if (!project) {
    logger.warn('No se selecciono ningun proyecto.');
    return null;
  }
  logger.success(`Proyecto: ${project.name}`);
  logger.info('');

  // Step 2: Clone repo
  logger.step(2, totalSteps, 'Clonar repositorio');
  const targetDir = await cloneRepo(project);
  if (!targetDir) {
    logger.warn('Clonado cancelado.');
    return null;
  }
  logger.success(`Repositorio en: ${targetDir}`);
  logger.info('');

  // Step 3: Install dependencies + hooks + guidelines
  logger.step(3, totalSteps, 'Instalar dependencias, hooks y guidelines');
  await installDeps(project, targetDir);
  await setupGitHooks(project, targetDir);
  logger.success('Dependencias, hooks y guidelines instalados.');
  logger.info('');

  // Step 4: Generate config files (.env, .claude/settings.json)
  logger.step(4, totalSteps, 'Generar ficheros de configuracion');
  generateProjectMCPConfig(project, targetDir);
  await generateConfig(project, targetDir);
  logger.success('Configuracion del proyecto generada.');

  return { project, dir: targetDir };
}

/**
 * Displays a summary of all configured projects.
 * @param {Array<{project: import('./catalog/projects.js').Project, dir: string}>} projects
 */
function showSummary(projects) {
  logger.info('');
  logger.info('==============================================');
  logger.success('  Configuracion completada!');
  logger.info('==============================================');
  logger.info('');

  if (projects.length === 0) {
    logger.info('  No se configuro ningun proyecto.');
    logger.info('  Ejecuta el wizard de nuevo cuando lo necesites.');
  } else {
    for (const { project, dir } of projects) {
      logger.info(`  ${project.name} (${project.abbreviation}) → ${dir}`);
    }
    logger.info('');
    logger.info('  Proximos pasos:');
    logger.info('    Revisa los ficheros .env y completa los valores');
    logger.info('    Revisa CLAUDE.md para las instrucciones de cada proyecto');
  }

  logger.info('');
}
