import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { logger } from '../utils/logger.js';
import { PROJECTS } from '../catalog/projects.js';

/**
 * Detects the current project by matching the directory name to the catalog.
 * @param {string} cwd - Current working directory
 * @returns {import('../catalog/projects.js').Project | null}
 */
function detectProject(cwd) {
  const dirName = basename(cwd);

  // Match by repo name
  const byRepo = PROJECTS.find((p) => p.repo === dirName);
  if (byRepo) return byRepo;

  // Match by package.json name
  const pkgPath = resolve(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const byName = PROJECTS.find(
        (p) => pkg.name === p.repo || pkg.name?.includes(p.abbreviation.toLowerCase())
      );
      if (byName) return byName;
    } catch {
      // ignore parse errors
    }
  }

  return null;
}

/**
 * Syncs git hooks and guidelines by re-running geniova-git-hooks generate.
 * @param {string} cwd
 * @returns {boolean}
 */
function syncGuidelines(cwd) {
  logger.info('  Regenerando guidelines para agentes IA...');

  try {
    execSync('npx @geniova/git-hooks generate', {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    logger.success('  Guidelines actualizados (CLAUDE.md, .cursorrules, copilot, gemini, codex)');
    return true;
  } catch {
    logger.warn('  No se pudo regenerar guidelines. Ejecuta: npx @geniova/git-hooks generate');
    return false;
  }
}

/**
 * Verifies hooks are installed and working.
 * @param {string} cwd
 * @returns {boolean}
 */
function verifyHooks(cwd) {
  logger.info('  Verificando git hooks...');

  const hooks = ['pre-commit', 'commit-msg', 'pre-push'];
  let allOk = true;

  for (const hook of hooks) {
    const hookPath = resolve(cwd, '.husky', hook);
    if (existsSync(hookPath)) {
      logger.success(`  Hook ${hook} instalado`);
    } else {
      logger.warn(`  Hook ${hook} no encontrado`);
      allOk = false;
    }
  }

  return allOk;
}

/**
 * Verifies MCP configuration exists.
 * @param {string} cwd
 * @param {import('../catalog/projects.js').Project} project
 * @returns {boolean}
 */
function verifyMCPs(cwd, project) {
  logger.info('  Verificando configuracion de MCPs...');

  const settingsPath = resolve(cwd, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) {
    logger.warn('  No se encontro .claude/settings.json. Ejecuta el wizard para configurar MCPs.');
    return false;
  }

  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    const mcpKeys = Object.keys(settings.mcpServers || {});

    for (const required of project.mcpsRequired) {
      if (mcpKeys.some((k) => k.includes(required))) {
        logger.success(`  MCP ${required} configurado`);
      } else {
        logger.warn(`  MCP ${required} (obligatorio) no encontrado`);
      }
    }

    return true;
  } catch {
    logger.warn('  Error leyendo .claude/settings.json');
    return false;
  }
}

/**
 * Verifies .env file exists.
 * @param {string} cwd
 * @returns {boolean}
 */
function verifyEnv(cwd) {
  logger.info('  Verificando configuracion...');

  const envPath = resolve(cwd, '.env');
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    const todoCount = (content.match(/TODO/g) || []).length;
    if (todoCount > 0) {
      logger.warn(`  .env tiene ${todoCount} valores TODO pendientes de completar`);
    } else {
      logger.success('  .env configurado');
    }
    return true;
  }

  logger.warn('  .env no encontrado. Ejecuta el wizard para generarlo.');
  return false;
}

/**
 * Runs the sync command: regenerates guidelines, verifies hooks, MCPs and config.
 * @param {string} [targetDir] - Directory to sync (defaults to cwd)
 */
export async function sync(targetDir) {
  const cwd = targetDir || process.cwd();

  logger.info('');
  logger.info('==============================================');
  logger.info('  Geniova Kit - Sync');
  logger.info('==============================================');
  logger.info('');

  // Detect project
  const project = detectProject(cwd);
  if (!project) {
    logger.error(
      'No se pudo detectar el proyecto. Asegurate de estar en un directorio de proyecto Geniova.'
    );
    return;
  }

  logger.success(`Proyecto detectado: ${project.name} (${project.abbreviation})`);
  logger.info('');

  const totalSteps = 4;

  // Step 1: Sync guidelines
  logger.step(1, totalSteps, 'Sincronizar guidelines');
  syncGuidelines(cwd);
  logger.info('');

  // Step 2: Verify hooks
  logger.step(2, totalSteps, 'Verificar git hooks');
  const hooksOk = verifyHooks(cwd);
  if (!hooksOk) {
    logger.warn('  Ejecuta: npx @geniova/git-hooks init');
  }
  logger.info('');

  // Step 3: Verify MCPs
  logger.step(3, totalSteps, 'Verificar MCPs');
  verifyMCPs(cwd, project);
  logger.info('');

  // Step 4: Verify config
  logger.step(4, totalSteps, 'Verificar configuracion');
  verifyEnv(cwd);
  logger.info('');

  // Summary
  logger.info('==============================================');
  logger.success('  Sync completado');
  logger.info('==============================================');
  logger.info('');
}
