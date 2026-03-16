import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { mkdirSync } from 'node:fs'

const PACKAGE_GUIDELINES = join(import.meta.dirname, '..', '..', 'guidelines')
const MONOREPO_GUIDELINES = join(import.meta.dirname, '..', '..', '..', '..', 'guidelines')
const GUIDELINES_DIR = existsSync(MONOREPO_GUIDELINES) ? MONOREPO_GUIDELINES : PACKAGE_GUIDELINES

const START_MARKER = '<!-- @geniova/git-hooks:start -->'
const END_MARKER = '<!-- @geniova/git-hooks:end -->'

/**
 * Orden en que se incluyen las guidelines.
 */
const GUIDELINE_ORDER = [
  'code-style.md',
  'naming-conventions.md',
  'error-handling.md',
  'testing.md',
  'security.md',
  'ui-ux.md',
  'commits-and-prs.md',
  'dependencies.md',
  'implementation-plan.md',
  'file-protection.md',
  'firebase-patterns.md',
  'astro-lit-patterns.md',
  'git-firebase-identity.md',
]

/**
 * Targets soportados: cada agente lee las instrucciones de un fichero distinto.
 */
const TARGETS = [
  { name: 'Claude Code', file: 'CLAUDE.md' },
  { name: 'GitHub Copilot', file: '.github/copilot-instructions.md' },
  { name: 'OpenAI Codex', file: 'AGENTS.md' },
  { name: 'Gemini', file: '.gemini/styleguide.md' },
  { name: 'Cursor', file: '.cursorrules' },
]

/**
 * Lee y concatena las guidelines estables en orden.
 * @returns {string}
 */
function loadGuidelines() {
  const available = readdirSync(GUIDELINES_DIR)
  const sections = []

  for (const filename of GUIDELINE_ORDER) {
    if (available.includes(filename)) {
      const content = readFileSync(join(GUIDELINES_DIR, filename), 'utf-8').trim()
      sections.push(content)
    }
  }

  return sections.join('\n\n---\n\n')
}

/**
 * Genera el bloque de guidelines gestionado por @geniova/git-hooks.
 * @returns {string}
 */
export function generateBlock() {
  const guidelines = loadGuidelines()

  return `${START_MARKER}
<!-- AUTOGENERADO por @geniova/git-hooks — no editar manualmente esta sección -->
<!-- Para regenerar: npx @geniova/git-hooks generate -->

# Geniova Development Guidelines

${guidelines}

---

# Guidelines dinámicas (Planning Game MCP)

Las siguientes guidelines se consultan en runtime vía Planning Game MCP al inicio de cada sesión.
NO están incluidas aquí porque evolucionan con frecuencia.

## Cómo consultarlas

| Recurso | Comando MCP | Cuándo |
|---------|-------------|--------|
| Workflow con Planning Game | \`get_global_config('instructions', '-OlzImzK4e5Qq8ZV0RNo')\` | Siempre al trabajar con tareas/bugs |
| Prompt de code review | \`get_global_config('prompts', '-OkmjTOQ-jErBg5JgXlI')\` | Al revisar PRs |
| Prompt de estimación | \`get_global_config('prompts', 'prompt_estimation')\` | Al estimar tareas |
| Prompt de acceptance criteria | \`get_global_config('prompts', 'prompt_acceptance_criteria')\` | Al crear tareas |
| Prompt de análisis de bugs | \`get_global_config('prompts', 'prompt_bug_analysis')\` | Al analizar bugs |
| BecarIA Developer | \`get_global_config('agents', 'agent_developer')\` | Configuración de agente dev |
| BecarIA Code Reviewer | \`get_global_config('agents', 'agent_reviewer')\` | Configuración de agente reviewer |
| Guidelines del proyecto | \`get_project(projectId)\` → \`agentsGuidelines\` | Siempre al empezar en un proyecto |
| ADRs del proyecto | \`list_adrs(projectId)\` | Antes de decisiones de arquitectura |
${END_MARKER}`
}

/**
 * Inyecta o actualiza el bloque gestionado dentro de un fichero existente.
 * Si el fichero ya contiene marcadores, reemplaza solo esa sección.
 * Si no los tiene, añade el bloque al final.
 *
 * @param {string} existingContent - Contenido actual (puede ser vacío)
 * @returns {string} - Contenido actualizado
 */
export function injectBlock(existingContent) {
  const block = generateBlock()

  if (!existingContent) {
    return block + '\n'
  }

  const startIdx = existingContent.indexOf(START_MARKER)
  const endIdx = existingContent.indexOf(END_MARKER)

  if (startIdx !== -1 && endIdx !== -1) {
    const before = existingContent.slice(0, startIdx)
    const after = existingContent.slice(endIdx + END_MARKER.length)
    return before + block + after
  }

  return existingContent.trimEnd() + '\n\n' + block + '\n'
}

/**
 * Genera/actualiza los ficheros de guidelines para todos los agentes soportados.
 *
 * @param {string} cwd - Directorio raíz del proyecto
 * @returns {{target: string, file: string, created: boolean}[]} - Resultados por target
 */
export function generateAllTargets(cwd) {
  const results = []

  for (const target of TARGETS) {
    const filePath = join(cwd, target.file)
    const dir = dirname(filePath)

    if (dir !== cwd && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const existing = existsSync(filePath) ? readFileSync(filePath, 'utf-8') : ''
    const updated = injectBlock(existing)
    writeFileSync(filePath, updated)

    results.push({
      target: target.name,
      file: target.file,
      created: !existing,
    })
  }

  return results
}

/**
 * Devuelve la lista de targets soportados.
 * @returns {{name: string, file: string}[]}
 */
export function getTargets() {
  return TARGETS
}
