import { execSync } from 'node:child_process';
import { success, error, info } from '../utils/logger.js';

const TOOLS = [
  {
    name: 'node',
    command: 'node --version',
    minVersion: '18',
    installHint: 'Instala Node.js >= 18: https://nodejs.org/',
    parseVersion: (output) => output.replace('v', '').trim(),
  },
  {
    name: 'gh',
    command: 'gh --version',
    installHint: 'Instala GitHub CLI: https://cli.github.com/',
  },
];

/**
 * Checks minimum prerequisites to bootstrap the private wizard.
 * Only node and gh are needed — the wizard handles the rest.
 */
export function checkPrerequisites() {
  info('Verificando prerrequisitos minimos...\n');

  const missing = [];

  for (const tool of TOOLS) {
    try {
      const output = execSync(tool.command, { stdio: 'pipe', encoding: 'utf-8' });

      if (tool.minVersion) {
        const version = tool.parseVersion(output);
        const major = parseInt(version.split('.')[0], 10);

        if (major < parseInt(tool.minVersion, 10)) {
          error(`${tool.name} encontrado pero version ${version} < ${tool.minVersion}`);
          missing.push(tool);
          continue;
        }
      }

      success(`${tool.name} encontrado`);
    } catch {
      error(`${tool.name} no encontrado`);
      missing.push(tool);
    }
  }

  console.log();

  if (missing.length > 0) {
    info('Instala las herramientas que faltan:\n');
    for (const tool of missing) {
      console.log(`    ${tool.name}: ${tool.installHint}`);
    }
    console.log();

    const exitError = new Error('Faltan prerrequisitos');
    exitError.code = 'EXIT';
    throw exitError;
  }
}
