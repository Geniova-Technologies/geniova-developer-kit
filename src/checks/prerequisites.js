import { execSync } from 'node:child_process';
import { success, error, info } from '../utils/logger.js';

const TOOLS = [
  {
    name: 'node',
    command: 'node --version',
    minVersion: '18',
    installHint: 'Instala Node.js >= 18: https://nodejs.org/ o usa nvm: nvm install 18',
    parseVersion: (output) => output.replace('v', '').trim(),
  },
  {
    name: 'pnpm',
    command: 'pnpm --version',
    installHint: 'Instala pnpm: npm install -g pnpm',
  },
  {
    name: 'gh',
    command: 'gh --version',
    installHint: 'Instala GitHub CLI: https://cli.github.com/',
  },
  {
    name: 'firebase',
    command: 'firebase --version',
    installHint: 'Instala Firebase CLI: npm install -g firebase-tools',
  },
  {
    name: 'claude',
    command: 'claude --version',
    installHint: 'Instala Claude Code: npm install -g @anthropic-ai/claude-code (requiere licencia Geniova)',
  },
  {
    name: 'karajan',
    command: 'kj --version',
    installHint: 'Instala Karajan: npm install -g karajan-code. Requiere Claude (obligatorio), Codex y Gemini opcionales (cuentas personales gratuitas)',
  },
];

/**
 * Checks that all required CLI tools are installed.
 * Exits with code 1 if any tool is missing.
 */
export function checkPrerequisites() {
  info('Verificando prerrequisitos...\n');

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
