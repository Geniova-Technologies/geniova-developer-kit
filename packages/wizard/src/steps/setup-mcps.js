import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { MCPS } from '../catalog/mcps.js';
import { confirm, input } from '../utils/prompt.js';
import { runInteractive } from '../utils/system.js';
import { logger } from '../utils/logger.js';

/**
 * Installs all MCPs at user level (global, run once).
 * Required MCPs are installed automatically, optional ones are proposed.
 * @returns {Promise<string[]>} IDs of installed MCPs
 */
export async function installGlobalMCPs() {
  const requiredMcps = MCPS.filter((mcp) => mcp.requiredForAll);
  const optionalMcps = MCPS.filter((mcp) => !mcp.requiredForAll);

  const installedIds = [];

  for (const mcp of requiredMcps) {
    logger.info(`  [Obligatorio] ${mcp.name}: ${mcp.description}`);
    await installMCP(mcp);
    installedIds.push(mcp.id);
  }

  for (const mcp of optionalMcps) {
    const install = await confirm(
      `  [Opcional] ${mcp.name} - ${mcp.description}. Instalar?`,
      false
    );
    if (install) {
      await installMCP(mcp);
      installedIds.push(mcp.id);
    }
  }

  return installedIds;
}

/**
 * Generates a .claude/settings.json for a specific project.
 * Lists which MCPs are relevant for the project.
 * @param {import('../catalog/projects.js').Project} project
 * @param {string} targetDir
 */
export function generateProjectMCPConfig(project, targetDir) {
  const projectMcpIds = [
    ...project.mcpsRequired,
    ...project.mcpsOptional,
  ];
  const projectMcps = MCPS.filter((mcp) => projectMcpIds.includes(mcp.id));

  const claudeDir = resolve(targetDir, '.claude');
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }

  const config = { mcpServers: {} };
  for (const mcp of projectMcps) {
    config.mcpServers[mcp.id] = { enabled: true, name: mcp.name };
  }

  const configPath = resolve(claudeDir, 'settings.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  logger.info(`  Generado: ${configPath}`);
}

/**
 * Asks user for a path with retry loop.
 * Smart enough to strip the filename if the user provides a full file path
 * instead of a directory path.
 * @param {string} promptMsg
 * @param {string} [validateFile]
 * @returns {Promise<string|null>}
 */
async function askPathWithRetry(promptMsg, validateFile) {
  while (true) {
    const userPath = await input(`  ${promptMsg}`);

    if (!userPath) {
      const skip = await confirm('  Saltar este MCP?', true);
      if (skip) return null;
      continue;
    }

    let resolvedPath = userPath.replace(/^~/, process.env.HOME || '~');

    // If user provided full path to the validate file, strip it to get the directory
    if (validateFile && resolvedPath.endsWith(validateFile)) {
      resolvedPath = dirname(resolvedPath);
    }

    if (!existsSync(resolvedPath)) {
      logger.warn(`  El directorio ${resolvedPath} no existe.`);
      const retry = await confirm('  Introducir otra ruta?', true);
      if (retry) continue;
      return null;
    }

    if (validateFile && !existsSync(resolve(resolvedPath, validateFile))) {
      logger.warn(`  No se encontro ${validateFile} en ${resolvedPath}.`);
      const retry = await confirm('  Introducir otra ruta?', true);
      if (retry) continue;
      return null;
    }

    return resolvedPath;
  }
}

/**
 * Installs a single MCP.
 * @param {import('../catalog/mcps.js').MCP} mcp
 */
async function installMCP(mcp) {
  if (mcp.installCommand) {
    logger.info(`  Instalando ${mcp.name}...`);
    const ok = runInteractive(mcp.installCommand);
    if (!ok) {
      logger.warn(`  No se pudo instalar ${mcp.name}.`);
      if (mcp.manualHint) logger.info(`  ${mcp.manualHint}`);
      const retry = await confirm('  Reintentar?', false);
      if (retry) return installMCP(mcp);
    }
    return;
  }

  if (mcp.promptPath && mcp.buildCommand) {
    logger.info(`  ${mcp.manualHint || ''}`);
    const promptMsg =
      mcp.pathPromptMessage || `Ruta al directorio de ${mcp.name}`;

    const resolvedPath = await askPathWithRetry(
      promptMsg,
      mcp.validateFile || null
    );

    if (!resolvedPath) {
      logger.warn(`  Saltando ${mcp.name}.`);
      return;
    }

    const command = mcp.buildCommand.replaceAll('{{path}}', resolvedPath);
    logger.info(`  Ejecutando: ${command}`);
    const ok = runInteractive(command);
    if (!ok) {
      logger.warn(`  No se pudo instalar ${mcp.name}.`);
      const retry = await confirm('  Reintentar con otra ruta?', true);
      if (retry) return installMCP(mcp);
      logger.info(`  Puedes instalarlo manualmente: ${command}`);
    }
    return;
  }

  if (mcp.manualHint) {
    logger.warn(`  ${mcp.name} requiere configuracion manual:`);
    logger.info(`  ${mcp.manualHint}`);
  }
}
