import { execSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { info, error, success } from '../utils/logger.js';

const PRIVATE_PACKAGE = '@geniova-technologies/geniova-kit';
const REGISTRY = 'https://npm.pkg.github.com';

/**
 * Gets the GitHub auth token from gh CLI or config file.
 * @returns {string|null}
 */
function getGhToken() {
  try {
    return execSync('gh auth token', {
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();
  } catch {
    // Fallback: read from gh config file (older gh versions)
  }

  try {
    const hostsPath = resolve(homedir(), '.config', 'gh', 'hosts.yml');
    const content = readFileSync(hostsPath, 'utf-8');
    const match = content.match(/oauth_token:\s*(.+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * Configures GitHub Packages registry and launches the private wizard.
 */
export async function launchWizard() {
  info('Configurando registry para paquetes privados...');

  try {
    const ghToken = getGhToken();
    if (!ghToken) {
      throw new Error('No se pudo obtener el token de GitHub');
    }

    execSync(`npm config set @geniova-technologies:registry ${REGISTRY}`, {
      stdio: 'pipe',
    });
    execSync(`npm config set //npm.pkg.github.com/:_authToken ${ghToken}`, {
      stdio: 'pipe',
    });

    success('Registry configurado');
  } catch (err) {
    error(err.message || 'No se pudo configurar el registry');
    info('Asegurate de tener gh autenticado con scope read:packages o write:packages');
    info('Ejecuta: gh auth refresh -h github.com -s read:packages\n');
    const exitError = new Error('Registry config failed');
    exitError.code = 'EXIT';
    throw exitError;
  }

  console.log();
  info(`Lanzando ${PRIVATE_PACKAGE}...\n`);

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['--yes', `${PRIVATE_PACKAGE}@latest`], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.log();
        error(`El wizard termino con codigo ${code}`);
        info('Si el problema persiste, ejecuta: gh auth refresh -s read:packages\n');
        const exitError = new Error('Wizard failed');
        exitError.code = 'EXIT';
        reject(exitError);
      }
    });

    child.on('error', (err) => {
      error(`Error al lanzar el wizard: ${err.message}`);
      const exitError = new Error('Wizard spawn failed');
      exitError.code = 'EXIT';
      reject(exitError);
    });
  });
}
