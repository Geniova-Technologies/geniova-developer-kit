import { execSync } from 'node:child_process';
import { success, error, info } from '../utils/logger.js';

/**
 * Verifies GitHub authentication, org membership and Firebase login.
 * Exits with code 1 if any check fails.
 */
export function checkAuth() {
  info('Verificando autenticacion...\n');

  const failures = [];

  // 1. Check gh auth status
  try {
    execSync('gh auth status', { stdio: 'pipe', encoding: 'utf-8' });
    success('GitHub CLI autenticado');
  } catch {
    error('GitHub CLI no autenticado');
    failures.push('Ejecuta: gh auth login');
  }

  // 2. Check org membership (only if gh is authenticated)
  if (failures.length === 0) {
    try {
      execSync('gh api user/memberships/orgs/Geniova-Technologies', {
        stdio: 'pipe',
        encoding: 'utf-8',
      });
      success('Miembro de Geniova-Technologies');
    } catch {
      error('No perteneces a la organizacion Geniova-Technologies');
      failures.push(
        'Solicita acceso a la org Geniova-Technologies en GitHub'
      );
    }
  }

  // 3. Check firebase login
  try {
    const output = execSync('firebase login:list', {
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    if (output.includes('No authorized accounts')) {
      throw new Error('No firebase accounts');
    }

    success('Firebase CLI autenticado');
  } catch {
    error('Firebase CLI no autenticado');
    failures.push('Ejecuta: firebase login');
  }

  console.log();

  if (failures.length > 0) {
    info('Corrige los problemas de autenticacion:\n');
    for (const hint of failures) {
      console.log(`    - ${hint}`);
    }
    console.log();

    const exitError = new Error('Faltan autenticaciones');
    exitError.code = 'EXIT';
    throw exitError;
  }
}
