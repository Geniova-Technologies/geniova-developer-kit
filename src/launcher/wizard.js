import { execSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { info, error, warn, success } from '../utils/logger.js';

const PRIVATE_PACKAGE = '@geniova-technologies/geniova-kit';
const REGISTRY = 'https://npm.pkg.github.com';

/**
 * Gets the GitHub auth token. Tries `gh auth token` first (gh >= 2.14),
 * falls back to reading ~/.config/gh/hosts.yml for older versions.
 * @returns {string|null}
 */
function getGhToken() {
  // Try modern gh auth token
  try {
    return execSync('gh auth token', {
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();
  } catch {
    // Fall through to manual extraction
  }

  // Fallback: read from gh config file (older gh versions)
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
 * Checks if the gh token has read:packages scope.
 * If not, runs `gh auth refresh` to add it.
 * @returns {boolean} true if scope is available after check
 */
function ensurePackagesScope() {
  try {
    const status = execSync('gh auth status 2>&1', {
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    if (status.includes('read:packages')) {
      return true;
    }
  } catch {
    // gh auth status failed or no scope info available
  }

  warn('El token de GitHub no tiene scope read:packages');
  info('Ejecutando: gh auth refresh -h github.com -s read:packages');
  info('Se abrira el navegador para autorizar...\n');

  try {
    execSync('gh auth refresh -h github.com -s read:packages', {
      stdio: 'inherit',
    });
    success('Scope read:packages añadido');
    return true;
  } catch {
    error('No se pudo añadir read:packages.');
    info('Ejecuta manualmente: gh auth refresh -h github.com -s read:packages');
    return false;
  }
}

/**
 * Configures GitHub Packages registry for @geniova-technologies scope
 * and launches the private wizard package.
 */
export async function launchWizard() {
  info('Configurando registry para paquetes privados...');

  // Ensure read:packages scope before anything else
  if (!ensurePackagesScope()) {
    const exitError = new Error('Missing read:packages scope');
    exitError.code = 'EXIT';
    throw exitError;
  }

  try {
    execSync(`npm config set @geniova-technologies:registry ${REGISTRY}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    const ghToken = getGhToken();
    if (!ghToken) {
      throw new Error('No se pudo obtener el token de GitHub');
    }

    execSync(`npm config set //npm.pkg.github.com/:_authToken ${ghToken}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    success('Registry configurado');
  } catch (err) {
    error(err.message || 'No se pudo configurar el registry de GitHub Packages');
    const exitError = new Error('Registry config failed');
    exitError.code = 'EXIT';
    throw exitError;
  }

  console.log();
  info(`Lanzando ${PRIVATE_PACKAGE}...\n`);

  return new Promise((resolve, reject) => {
    const child = spawn('npx', [PRIVATE_PACKAGE], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.log();
        if (code === 128 || code === 1) {
          error(
            `No se pudo ejecutar ${PRIVATE_PACKAGE}. Posibles causas:`
          );
          console.log('    - No tienes acceso a GitHub Packages de Geniova-Technologies');
          console.log('    - El paquete aun no esta publicado');
          console.log('    - Ejecuta: gh auth refresh -s read:packages');
        } else {
          error(`El wizard termino con codigo ${code}`);
        }
        console.log();
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
