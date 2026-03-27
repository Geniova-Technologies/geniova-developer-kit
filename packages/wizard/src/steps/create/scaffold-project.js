import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInteractive } from '../../utils/system.js';
import { logger } from '../../utils/logger.js';

/**
 * Scaffolds the project structure based on the selected stack.
 * @param {import('./gather-info.js').ProjectSpec} spec
 * @param {string} targetDir - Absolute path to the project directory
 * @returns {boolean} true if scaffold succeeded
 */
export async function scaffoldProject(spec, targetDir) {
  switch (spec.stack) {
    case 'astro-lit':
      return scaffoldAstroLit(spec, targetDir);
    case 'next':
      return scaffoldNext(spec, targetDir);
    case 'node':
      return scaffoldNode(spec, targetDir);
    default:
      logger.error(`  Stack desconocido: ${spec.stack}`);
      return false;
  }
}

/**
 * Scaffolds an Astro + Lit project.
 * @param {import('./gather-info.js').ProjectSpec} spec
 * @param {string} targetDir
 * @returns {boolean}
 */
function scaffoldAstroLit(spec, targetDir) {
  logger.info('  Creando scaffold Astro + Lit...');

  const ok = runInteractive(
    `pnpm create astro@latest "${targetDir}" --template minimal --no-install --no-git --skip-houston`
  );

  if (!ok) {
    logger.error('  Fallo al crear scaffold Astro. Intenta manualmente: pnpm create astro@latest');
    return false;
  }

  // Astro config already exists from template, we just need to ensure lit is in dependencies
  const pkgPath = resolve(targetDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileContent(pkgPath));
      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies['lit'] = '^3.0.0';
      pkg.dependencies['@astrojs/lit'] = '^4.0.0';
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    } catch {
      logger.warn('  No se pudo inyectar lit en package.json. Anadelo manualmente.');
    }
  }

  writeGitignore(targetDir, 'astro');
  writeEnvFile(spec, targetDir);

  logger.success('  Scaffold Astro + Lit creado.');
  return true;
}

/**
 * Scaffolds a Next.js project.
 * @param {import('./gather-info.js').ProjectSpec} spec
 * @param {string} targetDir
 * @returns {boolean}
 */
function scaffoldNext(spec, targetDir) {
  logger.info('  Creando scaffold Next.js...');

  const ok = runInteractive(
    `pnpm create next-app@latest "${targetDir}" --use-pnpm --no-git --no-install --js --no-tailwind --no-eslint --no-src-dir --no-app --no-import-alias`
  );

  if (!ok) {
    logger.error('  Fallo al crear scaffold Next. Intenta manualmente: pnpm create next-app@latest');
    return false;
  }

  writeGitignore(targetDir, 'next');
  writeEnvFile(spec, targetDir);

  logger.success('  Scaffold Next.js creado.');
  return true;
}

/**
 * Scaffolds a minimal Node.js project (CLI or API).
 * @param {import('./gather-info.js').ProjectSpec} spec
 * @param {string} targetDir
 * @returns {boolean}
 */
function scaffoldNode(spec, targetDir) {
  logger.info('  Creando scaffold Node.js...');

  const pkg = {
    name: `@geniova-technologies/${spec.name}`,
    version: '0.1.0',
    description: spec.description,
    main: 'src/index.js',
    type: 'module',
    engines: { node: '>=18' },
    license: 'UNLICENSED',
    scripts: {
      start: 'node src/index.js',
      test: 'vitest run',
    },
  };

  writeFileSync(resolve(targetDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  const srcDir = resolve(targetDir, 'src');
  if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });
  writeFileSync(resolve(srcDir, 'index.js'), '// Entry point\n');

  writeGitignore(targetDir, 'node');
  writeEnvFile(spec, targetDir);

  logger.success('  Scaffold Node.js creado.');
  return true;
}

/**
 * Generates a .env file with Firebase/Vercel config if applicable.
 * @param {import('./gather-info.js').ProjectSpec} spec
 * @param {string} targetDir
 */
function writeEnvFile(spec, targetDir) {
  const lines = [
    `PROJECT_NAME=${spec.name}`,
    `ABBREVIATION=${spec.abbreviation}`,
  ];

  if (spec.usesFirebase && spec.firebaseProjectId) {
    lines.push('', '# Firebase');
    lines.push(`FIREBASE_PROJECT=${spec.firebaseProjectId}`);
    if (spec.firebaseConfig) {
      const fc = spec.firebaseConfig;
      if (fc.apiKey) lines.push(`FIREBASE_API_KEY=${fc.apiKey}`);
      if (fc.authDomain) lines.push(`FIREBASE_AUTH_DOMAIN=${fc.authDomain}`);
      if (fc.storageBucket) lines.push(`FIREBASE_STORAGE_BUCKET=${fc.storageBucket}`);
      if (fc.messagingSenderId) lines.push(`FIREBASE_MESSAGING_SENDER_ID=${fc.messagingSenderId}`);
      if (fc.appId) lines.push(`FIREBASE_APP_ID=${fc.appId}`);
    }
  }

  if (spec.usesVercel && spec.vercelProjectId) {
    lines.push('', '# Vercel');
    lines.push(`VERCEL_PROJECT_ID=${spec.vercelProjectId}`);
    if (spec.vercelTeamSlug) lines.push(`VERCEL_TEAM_SLUG=${spec.vercelTeamSlug}`);
  }

  lines.push('');
  writeFileSync(resolve(targetDir, '.env'), lines.join('\n'));
}

/**
 * Writes a .gitignore file appropriate for the stack.
 * Only writes if .gitignore does not already exist.
 * @param {string} targetDir
 * @param {'astro' | 'next' | 'node'} stack
 */
function writeGitignore(targetDir, stack) {
  const gitignorePath = resolve(targetDir, '.gitignore');
  if (existsSync(gitignorePath)) return;

  const common = [
    'node_modules/',
    'dist/',
    '.env',
    '.env.*',
    '!.env.example',
    '.DS_Store',
    '*.log',
  ];

  const extra = {
    astro: ['.astro/'],
    next: ['.next/', 'out/'],
    node: ['coverage/'],
  };

  const lines = [...common, ...(extra[stack] || []), ''];
  writeFileSync(gitignorePath, lines.join('\n'));
}

/**
 * Reads file content as UTF-8 string.
 * @param {string} filePath
 * @returns {string}
 */
function readFileContent(filePath) {
  return readFileSync(filePath, 'utf-8');
}
