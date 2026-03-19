import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { input, confirm } from '../utils/prompt.js';
import { logger } from '../utils/logger.js';

/**
 * Path to guidelines source (from @geniova/git-hooks package or monorepo).
 * Resolved at runtime from the installed git-hooks package.
 */
function findGuidelinesDir() {
  // Try monorepo path first
  const monorepo = resolve(import.meta.dirname, '..', '..', '..', 'git-hooks', 'guidelines');
  if (existsSync(monorepo)) return monorepo;

  // Try installed package
  try {
    const pkgPath = resolve(import.meta.dirname, '..', '..', 'node_modules', '@geniova', 'git-hooks', 'guidelines');
    if (existsSync(pkgPath)) return pkgPath;
  } catch { /* ignore */ }

  return null;
}

/**
 * Generates the common CLAUDE.md for the Geniova workspace root.
 * This file is read by Claude Code for ALL projects under this directory.
 * @returns {string}
 */
function generateWorkspaceClaudeMd() {
  return `# Geniova Technologies - Workspace Guidelines

> Este CLAUDE.md aplica a TODOS los proyectos dentro de este directorio.
> Cada proyecto tiene su propio CLAUDE.md con contexto específico.
> Detalle completo de cada guideline en \`.ai/guidelines/\`.

## Code Style (.ai/guidelines/code-style.md)
- Principios: SOLID, DRY, KISS, YAGNI
- JS vanilla + JSDoc por defecto (TypeScript solo si el proyecto ya lo usa)
- \`const\` por defecto, \`let\` solo cuando sea necesario
- Sin fallbacks silenciosos: el sistema funciona o falla
- Cadenas \`||\` para datos críticos PROHIBIDO
- No sobre-ingeniar: no añadir features ni abstracciones no pedidas

## Naming (.ai/guidelines/naming-conventions.md)
- Ficheros: \`kebab-case\` | Variables/funciones: \`camelCase\` | Constantes: \`UPPER_SNAKE_CASE\` | Clases: \`PascalCase\`
- Componentes Lit tag: \`kebab-case\` con prefijo | clase: \`PascalCase\`
- Firestore colecciones: \`camelCase\` plural | campos: \`camelCase\`
- Código en inglés, UI en español, logs en inglés

## Error Handling (.ai/guidelines/error-handling.md)
- Fallar explícitamente, nunca en silencio. \`catch\` vacíos prohibidos
- Funciones internas: dejar que falle. Boundaries (UI, endpoint): capturar y comunicar
- Validar entrada temprano con mensajes descriptivos

## Testing (.ai/guidelines/testing.md)
- Test-first obligatorio: verificar/crear tests ANTES de modificar código
- Vitest (unit/integration), Playwright (E2E)
- Coverage: servicios 80%, utilidades 90%, componentes 70%

## Security (.ai/guidelines/security.md)
- Validar entrada, sanitizar datos (XSS), parameterized queries
- NUNCA commitear credenciales, API keys, secrets
- \`serviceAccountKey.json\` NUNCA en git

## UI/UX (.ai/guidelines/ui-ux.md)
- NUNCA usar \`alert()\`, \`confirm()\`, \`prompt()\` nativos — usar sistema de modales
- Loading/spinner en operaciones async, notificaciones toast para feedback
- Mobile-first, responsive, accesible

## Commits y PRs (.ai/guidelines/commits-and-prs.md)
- Conventional Commits: \`feat:\`, \`fix:\`, \`refactor:\`, \`docs:\`, \`test:\`, \`chore:\`
- NUNCA referencias a IA en commits
- Max ~300 líneas por PR (ideal < 200), NUNCA push directo a main

## Dependencies (.ai/guidelines/dependencies.md)
- Añadir solo si no se resuelve en <50 líneas. \`package-lock.json\` SIEMPRE en git

## Implementation Plan (.ai/guidelines/implementation-plan.md)
- Rellenar ANTES de implementar si devPoints >= 3, afecta >2 ficheros, o hay múltiples enfoques

## File Protection (.ai/guidelines/file-protection.md)
- NUNCA sobreescribir archivos existentes sin leer primero

## Astro + Lit (.ai/guidelines/astro-lit-patterns.md)
- Astro: páginas y contenido estático. Lit: componentes interactivos (Web Components)
- Evaluar SSG vs SPA vs View Transitions al inicio del proyecto

## Firebase (.ai/guidelines/firebase-patterns.md)
- Modelar Firestore para las queries. Campos: \`createdAt\`, \`createdBy\`, \`updatedAt\`, \`updatedBy\`
- Security rules: denegar por defecto. Cloud Functions: idempotentes, Admin SDK solo server-side

## Git & Firebase Identity (.ai/guidelines/git-firebase-identity.md)
- SSH obligatorio para remotos git, NUNCA HTTPS
- Verificar \`git config user.email\` antes de push (cuenta Geniova)
- Firebase: SIEMPRE \`--account usuario@geniova.com\`, NUNCA \`firebase login:use\`

---

## Guidelines dinámicas (Planning Game MCP)

Consultar en runtime al inicio de cada sesión:

| Recurso | Comando MCP |
|---------|-------------|
| Workflow PG | \`get_global_config('instructions', '-OlzImzK4e5Qq8ZV0RNo')\` |
| Guidelines del proyecto | \`get_project(projectId)\` → \`agentsGuidelines\` |
| ADRs del proyecto | \`list_adrs(projectId)\` |
| Prompts (estimación, AC, bugs) | \`list_global_config('prompts')\` |
`;
}

/**
 * Asks for the Geniova workspace directory and sets up common guidelines.
 * Creates CLAUDE.md and .ai/guidelines/ at the workspace root.
 *
 * @returns {Promise<string|null>} The workspace path, or null if skipped
 */
export async function setupWorkspace() {
  const defaultPath = resolve(process.env.HOME || '~', 'ws_geniova');

  logger.info('  El directorio de trabajo es donde tienes (o tendras) todos');
  logger.info('  los proyectos de Geniova clonados. Las guidelines comunes');
  logger.info('  se aplican a todos los proyectos dentro de este directorio.');
  logger.info('');

  let workspacePath = await input(
    `  Directorio de trabajo Geniova [${defaultPath}]`
  );

  if (!workspacePath) {
    workspacePath = defaultPath;
  }

  workspacePath = workspacePath.replace(/^~/, process.env.HOME || '~');

  if (!existsSync(workspacePath)) {
    const create = await confirm(`  ${workspacePath} no existe. Crearlo?`, true);
    if (!create) {
      logger.warn('  Saltando configuracion del workspace.');
      return null;
    }
    mkdirSync(workspacePath, { recursive: true });
    logger.success(`  Directorio creado: ${workspacePath}`);
  }

  // Generate workspace CLAUDE.md
  const claudeMdPath = join(workspacePath, 'CLAUDE.md');
  if (existsSync(claudeMdPath)) {
    const overwrite = await confirm('  CLAUDE.md ya existe en el workspace. Regenerar?', false);
    if (!overwrite) {
      logger.info('  CLAUDE.md existente conservado.');
    } else {
      writeFileSync(claudeMdPath, generateWorkspaceClaudeMd());
      logger.success('  CLAUDE.md regenerado.');
    }
  } else {
    writeFileSync(claudeMdPath, generateWorkspaceClaudeMd());
    logger.success('  CLAUDE.md generado en el workspace.');
  }

  // Copy full guidelines to .ai/guidelines/
  const guidelinesDir = findGuidelinesDir();
  if (guidelinesDir) {
    const aiDir = join(workspacePath, '.ai', 'guidelines');
    if (!existsSync(aiDir)) {
      mkdirSync(aiDir, { recursive: true });
    }

    const files = readdirSync(guidelinesDir).filter(f => f.endsWith('.md') && f !== 'README.md');
    for (const file of files) {
      copyFileSync(join(guidelinesDir, file), join(aiDir, file));
    }
    logger.success(`  .ai/guidelines/ actualizado (${files.length} ficheros).`);
  } else {
    logger.warn('  No se encontraron guidelines para copiar.');
    logger.info('  Ejecuta "npx @geniova/git-hooks generate" en cualquier proyecto para generarlas.');
  }

  return workspacePath;
}
