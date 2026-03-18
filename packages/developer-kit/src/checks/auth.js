import { execSync } from 'node:child_process';
import { success, error, info } from '../utils/logger.js';

/**
 * Verifies GitHub authentication only.
 * All other auth checks (firebase, org membership) are in the private wizard.
 */
export function checkAuth() {
  info('Verificando autenticacion...\n');

  try {
    execSync('gh auth status', { stdio: 'pipe', encoding: 'utf-8' });
    success('GitHub CLI autenticado');
  } catch {
    error('GitHub CLI no autenticado');
    info('Ejecuta: gh auth login\n');

    const exitError = new Error('GitHub no autenticado');
    exitError.code = 'EXIT';
    throw exitError;
  }

  console.log();
}
