import { select, confirm, input, multilineInput } from '../../utils/prompt.js';
import { logger } from '../../utils/logger.js';

/**
 * @typedef {Object} ProjectSpec
 * @property {string} name - kebab-case project name (e.g. "my-project")
 * @property {string} displayName - Human-readable name
 * @property {string} abbreviation - 3-letter uppercase code (e.g. "MYP")
 * @property {string} description - Short project description
 * @property {'astro-lit' | 'next' | 'node'} stack - Technology stack
 * @property {boolean} usesFirebase - Whether the project uses Firebase
 * @property {object|null} firebaseConfig - Parsed Firebase config JSON
 * @property {string|null} firebaseProjectId - Firebase project ID
 * @property {boolean} usesVercel - Whether the project uses Vercel
 * @property {string|null} vercelProjectId - Vercel project ID
 * @property {string|null} vercelTeamSlug - Vercel team slug
 * @property {'private' | 'public'} visibility - GitHub repo visibility
 */

const KEBAB_CASE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const ABBREVIATION_RE = /^[A-Z]{3}$/;

const STACKS = [
  { label: 'Astro + Lit (Web Components)', value: 'astro-lit' },
  { label: 'Next.js (React)', value: 'next' },
  { label: 'Node.js puro (CLI / API)', value: 'node' },
];

/**
 * Validates that a string is valid kebab-case.
 * @param {string} value
 * @returns {boolean}
 */
export function isKebabCase(value) {
  return KEBAB_CASE_RE.test(value);
}

/**
 * Validates that a string is a 3-letter uppercase abbreviation.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidAbbreviation(value) {
  return ABBREVIATION_RE.test(value);
}

/**
 * Tries to parse a JSON string. Returns the parsed object or null.
 * @param {string} text
 * @returns {object|null}
 */
export function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Interactive wizard to gather all info needed to create a new project.
 * @returns {Promise<ProjectSpec|null>} null if user cancels
 */
export async function gatherProjectInfo() {
  logger.info('\n  Nuevo proyecto Geniova — datos basicos\n');

  // Name (kebab-case)
  let name = '';
  while (!isKebabCase(name)) {
    name = await input('Nombre del proyecto (kebab-case, ej: my-project)');
    if (!name) return null;
    if (!isKebabCase(name)) {
      logger.warn('  El nombre debe ser kebab-case (ej: my-project)');
    }
  }

  // Display name
  const displayName = await input('Nombre visible (ej: My Project)', name);

  // Abbreviation
  let abbreviation = '';
  while (!isValidAbbreviation(abbreviation)) {
    abbreviation = await input('Abreviatura (3 letras mayusculas, ej: MYP)');
    if (!abbreviation) return null;
    abbreviation = abbreviation.toUpperCase();
    if (!isValidAbbreviation(abbreviation)) {
      logger.warn('  La abreviatura debe ser exactamente 3 letras mayusculas');
    }
  }

  // Description
  const description = await input('Descripcion corta del proyecto');

  // Stack
  const stack = await select(STACKS, 'Stack tecnologico');

  // Firebase
  const usesFirebase = await confirm('Este proyecto usa Firebase?', true);
  let firebaseConfig = null;
  let firebaseProjectId = null;

  if (usesFirebase) {
    logger.info('  Pega el objeto firebaseConfig del proyecto (de Firebase Console):');
    while (!firebaseConfig) {
      const raw = await multilineInput('  firebaseConfig JSON:');
      firebaseConfig = parseJSON(raw);
      if (!firebaseConfig) {
        logger.warn('  JSON no valido. Intenta de nuevo.');
        const retry = await confirm('  Reintentar?', true);
        if (!retry) {
          firebaseConfig = null;
          break;
        }
      }
    }
    if (firebaseConfig && firebaseConfig.projectId) {
      firebaseProjectId = firebaseConfig.projectId;
    } else if (usesFirebase) {
      firebaseProjectId = await input('Firebase Project ID (ej: my-project-prod)');
    }
  }

  // Vercel
  const usesVercel = stack === 'next' ? await confirm('Este proyecto usa Vercel?', true) : false;
  let vercelProjectId = null;
  let vercelTeamSlug = null;

  if (usesVercel) {
    vercelProjectId = await input('Vercel Project ID');
    vercelTeamSlug = await input('Vercel Team Slug (dejar vacio si personal)', '');
  }

  // Visibility
  const visibility = await select(
    [
      { label: 'Privado (por defecto)', value: 'private' },
      { label: 'Publico', value: 'public' },
    ],
    'Visibilidad del repo en GitHub'
  );

  // Confirm
  console.log('');
  logger.info('  Resumen:');
  console.log(`    Nombre:       ${name}`);
  console.log(`    Display:      ${displayName}`);
  console.log(`    Abreviatura:  ${abbreviation}`);
  console.log(`    Descripcion:  ${description}`);
  console.log(`    Stack:        ${stack}`);
  console.log(`    Firebase:     ${usesFirebase ? firebaseProjectId || 'si' : 'no'}`);
  console.log(`    Vercel:       ${usesVercel ? vercelProjectId || 'si' : 'no'}`);
  console.log(`    Visibilidad:  ${visibility}`);
  console.log('');

  const ok = await confirm('Continuar con estos datos?', true);
  if (!ok) return null;

  return {
    name,
    displayName,
    abbreviation,
    description,
    stack,
    usesFirebase,
    firebaseConfig,
    firebaseProjectId,
    usesVercel,
    vercelProjectId,
    vercelTeamSlug,
    visibility,
  };
}
