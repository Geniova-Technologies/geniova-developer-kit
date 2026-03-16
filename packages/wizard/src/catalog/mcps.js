/**
 * @typedef {Object} MCP
 * @property {string} id - Unique MCP identifier
 * @property {string} name - Display name
 * @property {string} description - Short description
 * @property {string} installCommand - Command to install/configure the MCP
 * @property {boolean} requiredForAll - Whether this MCP is required for all projects
 */

/** @type {MCP[]} */
export const MCPS = [
  {
    id: 'planning-game',
    name: 'Planning Game MCP',
    description:
      'Gestion de proyectos agiles (XP). Obligatorio para todos los proyectos Geniova.',
    installCommand: 'npx @anthropic/create-mcp@latest planning-game',
    requiredForAll: true,
  },
  {
    id: 'chrome-devtools',
    name: 'Chrome DevTools MCP',
    description:
      'Verificacion visual en navegador, screenshots, depuracion de consola y red.',
    installCommand: 'npx @anthropic/create-mcp@latest chrome-devtools',
    requiredForAll: false,
  },
  {
    id: 'sonarqube',
    name: 'SonarQube MCP',
    description:
      'Analisis de calidad de codigo, code smells, bugs y vulnerabilidades.',
    installCommand: 'npx @anthropic/create-mcp@latest sonarqube',
    requiredForAll: false,
  },
  {
    id: 'karajan',
    name: 'Karajan MCP',
    description:
      'Orquestacion de agentes y code review. Obligatorio. Requiere Claude (licencia Geniova). Codex y Gemini opcionales (cuentas personales gratuitas).',
    installCommand: 'npx @anthropic/create-mcp@latest karajan',
    requiredForAll: true,
  },
];
