/**
 * @typedef {Object} MCP
 * @property {string} id - Unique MCP identifier
 * @property {string} name - Display name
 * @property {string} claudeName - Name used in `claude mcp add <name>` (for checking if already installed)
 * @property {string} description - Short description
 * @property {string|null} installCommand - Command to install/configure the MCP (null if manual)
 * @property {string|null} manualHint - Instructions for manual setup (shown when installCommand is null)
 * @property {boolean} requiredForAll - Whether this MCP is required for all projects
 * @property {boolean} [promptPath] - If true, ask user for a path before installing
 * @property {string} [buildCommand] - Command template with {{path}} placeholder
 */

/** @type {MCP[]} */
export const MCPS = [
  {
    id: 'planning-game',
    name: 'Planning Game MCP',
    claudeName: 'planning-game-pro',
    description:
      'Gestion de proyectos agiles (XP). Obligatorio para todos los proyectos Geniova.',
    installCommand: null,
    manualHint:
      'Requiere Docker con imagen planning-game-mcp. Descarga serviceAccountKey.json del Drive de Geniova: APP-CONFIG/Planning-GameXP/MCP Server PlanningGame',
    requiredForAll: true,
    promptPath: true,
    pathPromptMessage:
      'Ruta al directorio de la instancia PG (donde esta serviceAccountKey.json)',
    validateFile: 'serviceAccountKey.json',
    buildCommand:
      'claude mcp add planning-game-pro -s user -- docker run --rm -i -v {{path}}/serviceAccountKey.json:/app/serviceAccountKey.json:ro -v {{path}}/mcp.user.json:/app/mcp.user.json -e GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccountKey.json -e FIREBASE_DATABASE_URL=https://planning-gamexp-default-rtdb.europe-west1.firebasedatabase.app -e MCP_INSTANCE_DIR=/app -e MCP_SERVER_NAME=planning-game-pro planning-game-mcp',
  },
  {
    id: 'chrome-devtools',
    name: 'Chrome DevTools MCP',
    claudeName: 'chrome-devtools',
    description:
      'Verificacion visual en navegador, screenshots, depuracion de consola y red.',
    installCommand:
      'claude mcp add chrome-devtools -s user -- npx chrome-devtools-mcp@latest',
    manualHint: null,
    requiredForAll: false,
  },
  {
    id: 'sonarqube',
    name: 'SonarQube MCP',
    claudeName: 'sonarqube',
    description:
      'Analisis de calidad de codigo, code smells, bugs y vulnerabilidades.',
    installCommand: null,
    manualHint:
      'Requiere Docker con SonarQube corriendo. Consulta la guia en CLAUDE.md.',
    requiredForAll: false,
  },
  {
    id: 'karajan',
    name: 'Karajan MCP',
    claudeName: 'karajan-mcp',
    description:
      'Orquestacion de agentes y code review. Obligatorio. Requiere Claude (licencia Geniova). Codex y Gemini opcionales (cuentas personales gratuitas).',
    installCommand: null,
    manualHint:
      'Requiere karajan-code clonado. El wizard te pedira la ruta donde lo tienes.',
    requiredForAll: true,
    promptPath: true,
    buildCommand:
      'claude mcp add karajan-mcp -s user -- node {{path}}/src/mcp/server.js',
  },
];
