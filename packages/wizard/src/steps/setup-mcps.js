import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { MCPS } from '../catalog/mcps.js';
import { confirm } from '../utils/prompt.js';
import { logger } from '../utils/logger.js';

/**
 * Sets up MCPs for the project.
 * Installs required MCPs automatically and proposes optional ones.
 * Generates a .claude/settings.json config file.
 * @param {import('../catalog/projects.js').Project} project
 * @param {string} targetDir - Absolute path to the project directory
 */
export async function setupMCPs(project, targetDir) {
  const requiredMcps = MCPS.filter((mcp) =>
    project.mcpsRequired.includes(mcp.id)
  );
  const optionalMcps = MCPS.filter((mcp) =>
    project.mcpsOptional.includes(mcp.id)
  );

  const selectedMcps = [...requiredMcps];

  // Install required MCPs automatically
  for (const mcp of requiredMcps) {
    logger.info(`  [Obligatorio] ${mcp.name}: ${mcp.description}`);
    installMCP(mcp, targetDir);
  }

  // Propose optional MCPs
  for (const mcp of optionalMcps) {
    const install = await confirm(
      `  [Opcional] ${mcp.name} - ${mcp.description}. Instalar?`,
      false
    );
    if (install) {
      installMCP(mcp, targetDir);
      selectedMcps.push(mcp);
    }
  }

  // Generate MCP config
  generateMCPConfig(selectedMcps, targetDir);
}

/**
 * Installs a single MCP.
 * @param {import('../catalog/mcps.js').MCP} mcp
 * @param {string} targetDir
 */
function installMCP(mcp, targetDir) {
  try {
    execSync(mcp.installCommand, {
      cwd: targetDir,
      stdio: 'inherit',
    });
  } catch {
    logger.warn(`No se pudo instalar ${mcp.name}. Instalalo manualmente.`);
  }
}

/**
 * Generates a .claude/settings.json with the MCP configuration.
 * @param {import('../catalog/mcps.js').MCP[]} mcps
 * @param {string} targetDir
 */
function generateMCPConfig(mcps, targetDir) {
  const claudeDir = resolve(targetDir, '.claude');
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }

  const config = {
    mcpServers: {},
  };

  for (const mcp of mcps) {
    config.mcpServers[mcp.id] = {
      enabled: true,
      name: mcp.name,
    };
  }

  const configPath = resolve(claudeDir, 'settings.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  logger.info(`  Generado: ${configPath}`);
}
