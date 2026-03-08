import { execSync, spawn } from 'node:child_process';
import { info, error, success } from '../utils/logger.js';

const PRIVATE_PACKAGE = '@geniova-technologies/geniova-kit';
const REGISTRY = 'https://npm.pkg.github.com';

/**
 * Configures GitHub Packages registry for @geniova-technologies scope
 * and launches the private wizard package.
 */
export async function launchWizard() {
  info('Configurando registry para paquetes privados...');

  try {
    execSync(`npm config set @geniova-technologies:registry ${REGISTRY}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    const ghToken = execSync('gh auth token', {
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();

    execSync(`npm config set //npm.pkg.github.com/:_authToken ${ghToken}`, {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    success('Registry configurado');
  } catch {
    error('No se pudo configurar el registry de GitHub Packages');
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
