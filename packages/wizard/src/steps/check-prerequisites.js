import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import {
  commandExists,
  execSucceeds,
  runInteractive,
  runWithArgs,
  getOutput,
  getOS,
  findSSHKeys,
} from '../utils/system.js';
import { confirm, input } from '../utils/prompt.js';
import { logger } from '../utils/logger.js';

/** Install commands indexed by tool and OS */
const INSTALL_COMMANDS = {
  git: { linux: 'sudo apt install -y git', macos: 'brew install git' },
  gh: { linux: 'sudo apt install -y gh', macos: 'brew install gh' },
  pnpm: { linux: 'npm install -g pnpm', macos: 'npm install -g pnpm' },
  firebase: {
    linux: 'npm install -g firebase-tools',
    macos: 'npm install -g firebase-tools',
  },
};

/** Full gh install via official repo (fallback for older Linux distros) */
const GH_APT_FULL_INSTALL =
  '(type -p wget >/dev/null || sudo apt-get install wget -y) && ' +
  'sudo mkdir -p -m 755 /etc/apt/keyrings && ' +
  'wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | ' +
  'sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null && ' +
  'sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg && ' +
  'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] ' +
  'https://cli.github.com/packages stable main" | ' +
  'sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null && ' +
  'sudo apt update && sudo apt install gh -y';

/**
 * Check all prerequisites and offer to install missing ones.
 * This is a real wizard step: detects, proposes, and executes installations.
 * @returns {Promise<boolean>} true if all critical prerequisites are met
 */
export async function checkPrerequisites() {
  logger.info('Verificando prerequisitos del sistema...');
  logger.info('');

  const os = getOS();
  let allGood = true;

  // 1. Node.js version
  if (!checkNodeVersion()) {
    return false;
  }

  // 2. git
  if (!(await checkAndInstall('git', 'git', os))) {
    allGood = false;
  }

  // 3. gh CLI (special handling for Linux repo fallback)
  if (!(await checkAndInstallGh(os))) {
    allGood = false;
  }

  // 4. GitHub authentication (only if gh is available)
  if (commandExists('gh')) {
    if (!(await checkGitHubAuth())) {
      allGood = false;
    }
  }

  // 5. GitHub Packages registry in ~/.npmrc (only if gh is authenticated)
  if (commandExists('gh') && execSucceeds('gh auth status')) {
    if (!(await configureGitHubPackages())) {
      allGood = false;
    }
  }

  // 6. pnpm
  if (!(await checkAndInstall('pnpm', 'pnpm', os))) {
    allGood = false;
  }

  // 7. firebase-tools
  if (!(await checkAndInstall('firebase', 'firebase', os))) {
    allGood = false;
  }

  // 8. Firebase authentication (only if firebase is available)
  if (commandExists('firebase')) {
    if (!(await checkFirebaseAuth())) {
      allGood = false;
    }
  }

  logger.info('');

  if (!allGood) {
    logger.warn('Algunos prerequisitos no se pudieron configurar.');
    const retry = await confirm('Instala lo que falte y pulsa Y para reintentar, o N para continuar sin ellos.', true);
    if (retry) {
      logger.info('');
      return checkPrerequisites();
    }
    return true;
  }

  return true;
}

/**
 * Check Node.js version is >= 18.
 */
function checkNodeVersion() {
  const major = parseInt(process.version.slice(1).split('.')[0], 10);
  if (major >= 18) {
    logger.success(`Node.js ${process.version}`);
    return true;
  }
  logger.error(
    `Node.js ${process.version} encontrado, se requiere >= 18. Actualiza Node.js y vuelve a ejecutar.`
  );
  return false;
}

/**
 * Generic check-and-install for a CLI tool.
 * @param {string} cmd - Command to check in PATH
 * @param {string} toolKey - Key in INSTALL_COMMANDS
 * @param {'linux' | 'macos' | 'other'} os
 * @returns {Promise<boolean>}
 */
async function checkAndInstall(cmd, toolKey, os) {
  if (commandExists(cmd)) {
    const ver = getOutput(`${cmd} --version`);
    const short = ver ? ver.split('\n')[0] : '';
    logger.success(`${cmd}${short ? ` (${short})` : ''}`);
    return true;
  }

  logger.warn(`${cmd} no encontrado.`);

  const installCmd = INSTALL_COMMANDS[toolKey]?.[os];
  if (!installCmd) {
    logger.error(`  No hay instalador automatico para ${cmd} en ${os}.`);
    logger.info('  Instalalo manualmente y vuelve a ejecutar el wizard.');
    return false;
  }

  const shouldInstall = await confirm(
    `  Instalar ${cmd}? Se ejecutara: ${installCmd}`
  );
  if (!shouldInstall) {
    logger.info(`  Saltando ${cmd}.`);
    return false;
  }

  logger.info(`  Ejecutando: ${installCmd}`);
  runInteractive(installCmd);

  if (commandExists(cmd)) {
    logger.success(`  ${cmd} instalado correctamente.`);
    return true;
  }

  logger.error(`  No se pudo instalar ${cmd}.`);
  return false;
}

/**
 * Special install logic for gh CLI on Linux (fallback to official repo if apt fails).
 * @param {'linux' | 'macos' | 'other'} os
 * @returns {Promise<boolean>}
 */
async function checkAndInstallGh(os) {
  if (commandExists('gh')) {
    const ver = getOutput('gh --version');
    const short = ver ? ver.split('\n')[0] : '';
    logger.success(`gh${short ? ` (${short})` : ''}`);
    return true;
  }

  logger.warn('gh (GitHub CLI) no encontrado.');

  if (os === 'other') {
    logger.error('  No hay instalador automatico para tu sistema.');
    logger.info('  Visita: https://cli.github.com/');
    return false;
  }

  const installCmd = INSTALL_COMMANDS.gh[os];
  const shouldInstall = await confirm(
    `  Instalar gh? Se ejecutara: ${installCmd}`
  );
  if (!shouldInstall) {
    logger.info('  Saltando gh.');
    return false;
  }

  logger.info(`  Ejecutando: ${installCmd}`);
  runInteractive(installCmd);

  // On Linux, if simple apt install didn't work, try adding the official repo
  if (!commandExists('gh') && os === 'linux') {
    logger.info(
      '  gh no disponible en los repos actuales. Configurando repo oficial de GitHub...'
    );
    const addRepo = await confirm(
      '  Añadir repositorio oficial de GitHub CLI?'
    );
    if (addRepo) {
      runInteractive(GH_APT_FULL_INSTALL);
    }
  }

  if (commandExists('gh')) {
    logger.success('  gh instalado correctamente.');
    return true;
  }

  logger.error('  No se pudo instalar gh.');
  logger.info('  Visita: https://cli.github.com/');
  return false;
}

/**
 * Check GitHub authentication. Handles SSH key detection and gh login flow.
 * @returns {Promise<boolean>}
 */
async function checkGitHubAuth() {
  if (execSucceeds('gh auth status')) {
    logger.success('GitHub autenticado');
    return true;
  }

  logger.warn('No estas autenticado en GitHub.');

  const sshKeys = findSSHKeys();

  if (sshKeys.length > 0) {
    logger.info(`  Claves SSH encontradas: ${sshKeys.join(', ')}`);
    logger.info('  Iniciando login en GitHub via SSH...');

    const ok = runInteractive('gh auth login -p ssh -s read:packages');
    if (ok) {
      logger.success('  Autenticado en GitHub via SSH.');
      return true;
    }
    logger.error('  No se pudo completar el login en GitHub.');
    return false;
  }

  // No SSH keys found
  logger.warn('  No se encontraron claves SSH en ~/.ssh/');

  const createKey = await confirm('  Crear una nueva clave SSH ed25519?');
  if (createKey) {
    const email = await input('  Email para la clave SSH');
    if (!email || !email.includes('@')) {
      logger.warn('  Email no valido. Saltando creacion de clave SSH.');
      return false;
    }

    logger.info('  Generando clave SSH...');
    const ok = runWithArgs('ssh-keygen', ['-t', 'ed25519', '-C', email]);
    if (!ok) {
      logger.error('  No se pudo generar la clave SSH.');
      return false;
    }

    logger.success('  Clave SSH creada.');
    logger.info(
      '  Iniciando login en GitHub (la clave se subira automaticamente)...'
    );

    const loginOk = runInteractive('gh auth login -p ssh -s read:packages');
    if (loginOk) {
      logger.success('  Autenticado en GitHub via SSH.');
      return true;
    }
    logger.error('  No se pudo completar el login en GitHub.');
    return false;
  }

  // User doesn't want SSH key - offer HTTPS
  const useHttps = await confirm('  Intentar login via HTTPS?');
  if (useHttps) {
    const ok = runInteractive('gh auth login -p https -w -s read:packages');
    if (ok) {
      logger.success('  Autenticado en GitHub via HTTPS.');
      return true;
    }
  }

  logger.error('  No se pudo autenticar en GitHub.');
  logger.info('  Opciones manuales:');
  logger.info('    1. ssh-keygen -t ed25519 -C "tu@email.com"');
  logger.info('    2. Añadir la clave en https://github.com/settings/keys');
  logger.info('    3. gh auth login -p ssh -s read:packages');
  return false;
}

/**
 * Configure ~/.npmrc so npm/pnpm can read @geniova-technologies packages from GitHub Packages.
 * @returns {Promise<boolean>}
 */
async function configureGitHubPackages() {
  const npmrcPath = resolve(homedir(), '.npmrc');
  let content = '';

  if (existsSync(npmrcPath)) {
    content = readFileSync(npmrcPath, 'utf-8');
  }

  const hasRegistry = content.includes(
    '@geniova-technologies:registry=https://npm.pkg.github.com'
  );
  const hasToken = content.includes('//npm.pkg.github.com/:_authToken=');

  if (hasRegistry && hasToken) {
    logger.success('GitHub Packages (@geniova-technologies) configurado en ~/.npmrc');
    return true;
  }

  logger.warn('GitHub Packages no configurado en ~/.npmrc');

  // Ensure read:packages or write:packages scope on the gh token
  const status = getOutput('gh auth status 2>&1') || '';
  if (!status.includes('read:packages') && !status.includes('write:packages')) {
    logger.info('  Añadiendo scope read:packages al token de GitHub...');
    const ok = runInteractive('gh auth refresh -s read:packages');
    if (!ok) {
      logger.error('  No se pudo añadir el scope read:packages.');
      return false;
    }
  }

  // Get token from gh
  const token = getOutput('gh auth token');
  if (!token) {
    logger.error('  No se pudo obtener el token de GitHub.');
    logger.info('  Configura ~/.npmrc manualmente:');
    logger.info(
      '    @geniova-technologies:registry=https://npm.pkg.github.com'
    );
    logger.info('    //npm.pkg.github.com/:_authToken=TU_TOKEN');
    return false;
  }

  const shouldConfigure = await confirm(
    '  Configurar ~/.npmrc para acceder a @geniova-technologies en GitHub Packages?'
  );
  if (!shouldConfigure) {
    logger.info('  Saltando configuracion de GitHub Packages.');
    return false;
  }

  // Build updated .npmrc content
  const lines = content ? content.split('\n') : [];

  if (!hasRegistry) {
    lines.push('@geniova-technologies:registry=https://npm.pkg.github.com');
  }

  const tokenLine = `//npm.pkg.github.com/:_authToken=${token}`;
  const tokenIdx = lines.findIndex((l) =>
    l.startsWith('//npm.pkg.github.com/:_authToken=')
  );
  if (tokenIdx >= 0) {
    lines[tokenIdx] = tokenLine;
  } else {
    lines.push(tokenLine);
  }

  // Write back, clean up empty lines, ensure trailing newline
  const cleaned = lines
    .filter((l, i) => !(l === '' && i > 0 && lines[i - 1] === ''))
    .join('\n')
    .replace(/\n*$/, '\n');

  writeFileSync(npmrcPath, cleaned);
  logger.success('  GitHub Packages configurado en ~/.npmrc');
  return true;
}

/**
 * Check Firebase authentication. Reads credential store or runs `firebase login`.
 * @returns {Promise<boolean>}
 */
async function checkFirebaseAuth() {
  const configPath = resolve(
    homedir(),
    '.config',
    'configstore',
    'firebase-tools.json'
  );

  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.tokens?.refresh_token) {
        const email = config.user?.email || 'configurado';
        logger.success(`Firebase autenticado (${email})`);
        return true;
      }
    } catch {
      // Fall through to login
    }
  }

  logger.warn('No estas autenticado en Firebase.');

  const shouldLogin = await confirm(
    '  Iniciar login en Firebase? (se abrira el navegador)'
  );
  if (!shouldLogin) {
    logger.info('  Saltando login de Firebase.');
    return false;
  }

  logger.info('  Ejecutando: firebase login');
  const ok = runInteractive('firebase login');
  if (ok) {
    logger.success('  Autenticado en Firebase.');
    return true;
  }

  logger.error('  No se pudo completar el login en Firebase.');
  logger.info('  Ejecuta manualmente: firebase login');
  return false;
}
