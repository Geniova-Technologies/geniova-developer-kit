import { logger } from '../../utils/logger.js';

/**
 * Prints the next steps the user should take after project creation.
 * Includes catalog entry JSON and Planning Game instructions.
 * @param {import('./gather-info.js').ProjectSpec} spec
 * @param {string} targetDir
 */
export function printNextSteps(spec, targetDir) {
  console.log('');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('  Proyecto creado con exito!');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Catalog entry
  console.log('');
  logger.info('  1. ENTRADA PARA EL CATALOGO (projects.js)');
  logger.info('  Anade este objeto al array PROJECTS en packages/wizard/src/catalog/projects.js:\n');

  const catalogEntry = {
    id: spec.name,
    name: spec.displayName,
    abbreviation: spec.abbreviation,
    repo: spec.name,
    stack: formatStack(spec.stack),
    description: spec.description,
    firebaseProject: spec.firebaseProjectId || null,
    mcpsRequired: ['planning-game', 'karajan'],
    mcpsOptional: ['chrome-devtools', 'sonarqube'],
  };

  console.log(JSON.stringify(catalogEntry, null, 2));

  // Planning Game
  console.log('');
  logger.info('  2. PLANNING GAME');
  logger.info('  Crea el proyecto en Planning Game con estos datos:\n');
  console.log(`    Nombre:       ${spec.displayName}`);
  console.log(`    Abreviatura:  ${spec.abbreviation}`);
  console.log(`    Descripcion:  ${spec.description}`);
  console.log(`    Repo:         Geniova-Technologies/${spec.name}`);
  console.log('');
  logger.info('  Comando MCP: create_project(projectId, ...)');

  // Install deps
  console.log('');
  logger.info('  3. INSTALAR DEPENDENCIAS');
  console.log(`    cd ${targetDir}`);
  console.log('    pnpm install');

  // Git hooks
  console.log('');
  logger.info('  4. VERIFICAR');
  console.log('    - Git hooks instalados (.husky/)');
  console.log('    - GitHub Actions en .github/workflows/');
  console.log('    - .claude/settings.json con MCPs');
  console.log('    - .env con config de Firebase/Vercel');
  console.log('    - Branch protection en GitHub');

  // Secrets
  console.log('');
  logger.info('  5. CONFIGURAR SECRETS EN GITHUB');
  console.log('    Settings > Secrets and variables > Actions');
  console.log('    - BECARIA_APP_ID (org level, ya deberia existir)');
  console.log('    - BECARIA_APP_PRIVATE_KEY (org level, ya deberia existir)');

  // Variables
  console.log('');
  logger.info('  6. CONFIGURAR VARIABLES EN GITHUB');
  console.log('    Settings > Secrets and variables > Actions > Variables');
  console.log('    - HOUSTON_AUTHORIZED_USER = mfosela');

  console.log('');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Formats stack ID into a human-readable label.
 * @param {string} stack
 * @returns {string}
 */
function formatStack(stack) {
  const map = {
    'astro-lit': 'Astro, Lit, Firebase, JS',
    next: 'Next, Tailwind, TypeScript',
    node: 'Node.js',
  };
  return map[stack] || stack;
}
