import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { commandExists, getOutput, runInteractive } from '../../utils/system.js';
import { confirm, input } from '../../utils/prompt.js';
import { logger } from '../../utils/logger.js';

const ORG = 'Geniova-Technologies';

/**
 * Creates a GitHub repository and clones it locally.
 * @param {import('./gather-info.js').ProjectSpec} spec
 * @returns {Promise<string|null>} Absolute path to cloned repo, or null on failure
 */
export async function createRepo(spec) {
  if (!commandExists('gh')) {
    logger.error('gh CLI no esta instalado. Instala: https://cli.github.com');
    return null;
  }

  const repoFullName = `${ORG}/${spec.name}`;
  const defaultDir = resolve(homedir(), 'ws_geniova');
  const targetParent = await input('Directorio destino', defaultDir);
  const targetDir = resolve(targetParent, spec.name);

  // Check if repo already exists on GitHub
  const existing = getOutput(`gh repo view ${repoFullName} --json name 2>&1`);
  if (existing && !existing.includes('not found') && !existing.includes('Could not')) {
    logger.warn(`  El repo ${repoFullName} ya existe en GitHub.`);
    const cloneExisting = await confirm('Clonar el repo existente?', true);
    if (cloneExisting) {
      if (existsSync(targetDir)) {
        logger.info(`  El directorio ${targetDir} ya existe. Usandolo.`);
        return targetDir;
      }
      const ok = runInteractive(`gh repo clone ${repoFullName} "${targetDir}"`);
      return ok ? targetDir : null;
    }
    return null;
  }

  // Check if local dir already exists
  if (existsSync(targetDir)) {
    logger.warn(`  El directorio ${targetDir} ya existe.`);
    const use = await confirm('Usar este directorio de todas formas?', false);
    if (!use) return null;
    return targetDir;
  }

  // Create repo
  logger.info(`  Creando repo ${repoFullName}...`);
  const visFlag = spec.visibility === 'public' ? '--public' : '--private';
  const descFlag = spec.description ? `--description "${spec.description}"` : '';

  const ok = runInteractive(
    `gh repo create ${repoFullName} ${visFlag} ${descFlag} --clone -- "${targetDir}"`
  );

  if (!ok) {
    logger.error('  No se pudo crear el repo. Verifica permisos en GitHub.');
    return null;
  }

  logger.success(`  Repo creado: ${repoFullName}`);
  return targetDir;
}
