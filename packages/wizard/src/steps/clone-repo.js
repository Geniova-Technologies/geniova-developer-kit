import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { input, confirm } from '../utils/prompt.js';
import { logger } from '../utils/logger.js';

/**
 * Clones the project repository using `gh repo clone`.
 * Asks the user for the target directory (default: ~/ws_geniova/{repo}).
 * @param {import('../catalog/projects.js').Project} project
 * @returns {Promise<string | null>} The absolute path to the cloned directory, or null if cancelled
 */
export async function cloneRepo(project) {
  const defaultDir = resolve(homedir(), 'ws_geniova', project.repo);

  const targetDir = await input(
    'Directorio destino',
    defaultDir
  );

  const absoluteDir = resolve(targetDir);

  if (existsSync(absoluteDir)) {
    logger.warn(`El directorio ${absoluteDir} ya existe.`);
    const proceed = await confirm('Continuar sin clonar?');
    if (!proceed) {
      return null;
    }
    return absoluteDir;
  }

  const orgRepo = `Geniova-Technologies/${project.repo}`;
  logger.info(`Clonando ${orgRepo} en ${absoluteDir}...`);

  try {
    execSync(`gh repo clone ${orgRepo} "${absoluteDir}"`, {
      stdio: 'inherit',
    });
  } catch {
    logger.error(`Error al clonar el repositorio ${orgRepo}.`);
    logger.info('Asegurate de tener `gh` instalado y autenticado.');
    return null;
  }

  return absoluteDir;
}
