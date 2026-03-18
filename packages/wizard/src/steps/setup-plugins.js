import { runInteractive, commandExists } from '../utils/system.js';
import { confirm } from '../utils/prompt.js';
import { logger } from '../utils/logger.js';

/**
 * Plugins to install globally for all Geniova developers.
 * Each entry: { name, marketplace (optional), description }
 */
const PLUGINS = [
  {
    name: 'frontend-design',
    description: 'Diseño de UI con calidad profesional',
  },
  {
    name: 'impeccable@impeccable',
    description: 'Suite completa de diseño frontend (polish, audit, animate, typeset, critique...)',
  },
  {
    name: 'code-review',
    description: 'Code review de PRs (/code-review)',
  },
  {
    name: 'pr-review-toolkit',
    description: 'Review de PRs avanzado (/review-pr)',
  },
  {
    name: 'code-simplifier',
    description: 'Simplifica y refina codigo automaticamente',
  },
  {
    name: 'security-guidance',
    description: 'Hook que avisa de vulnerabilidades al editar ficheros',
  },
  {
    name: 'commit-commands',
    description: 'Comandos de commit (/commit, /commit-push-pr)',
  },
  {
    name: 'claude-code-setup',
    description: 'Recomienda hooks, MCPs y skills para un proyecto',
  },
];

/**
 * Installs Claude Code plugins globally.
 * Plugins are idempotent — reinstalling an existing one is a no-op.
 * @returns {Promise<void>}
 */
export async function installPlugins() {
  if (!commandExists('claude')) {
    logger.warn('Claude Code no detectado. Saltando instalacion de plugins.');
    return;
  }

  logger.info('  Plugins a instalar:');
  for (const plugin of PLUGINS) {
    logger.info(`    - ${plugin.name}: ${plugin.description}`);
  }
  logger.info('');

  const proceed = await confirm('  Instalar todos los plugins?', true);
  if (!proceed) {
    logger.info('  Saltando instalacion de plugins.');
    return;
  }

  for (const plugin of PLUGINS) {
    logger.info(`  Instalando ${plugin.name}...`);
    const ok = runInteractive(`claude plugins install ${plugin.name}`);
    if (ok) {
      logger.success(`  ${plugin.name} instalado.`);
    } else {
      logger.warn(`  No se pudo instalar ${plugin.name}. Puedes instalarlo manualmente: claude plugins install ${plugin.name}`);
    }
  }
}
