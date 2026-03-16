import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { logger } from '../utils/logger.js';

/** Projects that require @geniova/auth SDK installed from local */
const PROJECTS_WITH_AUTH = [
  'extranet-v2',
  'intranet',
  'intranet-extended',
  'geniova-platform',
  'geniova-employee',
  'portal-incidencias',
  'auth-sign',
  'inventario',
  'geniova-space',
];

/**
 * Installs project dependencies using pnpm.
 * If the project requires @geniova/auth, installs it from the local SDK path.
 * @param {import('../catalog/projects.js').Project} project
 * @param {string} targetDir - Absolute path to the project directory
 */
export async function installDeps(project, targetDir) {
  logger.info('Ejecutando pnpm install...');

  try {
    execSync('pnpm install', {
      cwd: targetDir,
      stdio: 'inherit',
    });
  } catch {
    logger.error('Error al ejecutar pnpm install.');
    logger.info('Asegurate de tener pnpm instalado: npm install -g pnpm');
    return;
  }

  if (PROJECTS_WITH_AUTH.includes(project.id)) {
    const authSdkPath = resolve(
      homedir(),
      'ws_geniova',
      'geniova-auth',
      'packages',
      'sdk'
    );

    if (existsSync(authSdkPath)) {
      logger.info('Instalando @geniova/auth desde SDK local...');
      try {
        execSync(`pnpm add ${authSdkPath}`, {
          cwd: targetDir,
          stdio: 'inherit',
        });
      } catch {
        logger.warn(
          'No se pudo instalar @geniova/auth. Instalalo manualmente desde: ' +
            authSdkPath
        );
      }
    } else {
      logger.warn(
        `@geniova/auth SDK no encontrado en ${authSdkPath}. ` +
          'Clona geniova-auth primero e instala el SDK manualmente.'
      );
    }
  }
}
