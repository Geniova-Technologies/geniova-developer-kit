import { readdirSync, readFileSync, existsSync, writeFileSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { mkdirSync } from 'node:fs'
import { GUIDELINES_SUMMARY } from './guidelines-summary.js'

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
 * Uses compact summary (~3.5K) instead of full content (~33K).
 * Full guidelines are copied to .ai/guidelines/ for deep reference.
 * @returns {string}
 */
export function generateBlock() {
  return `${START_MARKER}
<!-- AUTOGENERADO por @geniova/git-hooks — no editar manualmente esta sección -->
<!-- Para regenerar: npx @geniova/git-hooks generate -->

${GUIDELINES_SUMMARY}

---

# Guidelines dinámicas (Planning Game MCP)

Consultar en runtime al inicio de cada sesión:

| Recurso | Comando MCP | Cuándo |
|---------|-------------|--------|
| Workflow con Planning Game | \`get_global_config('instructions', '-OlzImzK4e5Qq8ZV0RNo')\` | Siempre al trabajar con tareas/bugs |
| Guidelines del proyecto | \`get_project(projectId)\` → \`agentsGuidelines\` | Siempre al empezar en un proyecto |
| ADRs del proyecto | \`list_adrs(projectId)\` | Antes de decisiones de arquitectura |
| Prompts (estimación, AC, bugs) | \`list_global_config('prompts')\` | Al estimar, crear tareas o analizar bugs |
| Agentes (BecarIA) | \`list_global_config('agents')\` | Configuración de agentes |
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

  // Copy full guidelines to .ai/guidelines/ for deep reference
  const copied = copyGuidelinesToAiDir(cwd)
  results.push({
    target: 'AI Guidelines Reference',
    file: `.ai/guidelines/ (${copied.length} files)`,
    created: true,
  })

  return results
}

/**
 * Copies full guideline files to .ai/guidelines/ in the target project.
 * These are the detailed reference that the summary in CLAUDE.md points to.
 *
 * @param {string} cwd - Project root directory
 * @returns {string[]} - List of copied files
 */
export function copyGuidelinesToAiDir(cwd) {
  const aiDir = join(cwd, '.ai', 'guidelines')
  if (!existsSync(aiDir)) {
    mkdirSync(aiDir, { recursive: true })
  }

  const available = readdirSync(GUIDELINES_DIR)
  const copied = []

  for (const filename of GUIDELINE_ORDER) {
    if (available.includes(filename)) {
      copyFileSync(join(GUIDELINES_DIR, filename), join(aiDir, filename))
      copied.push(filename)
    }
  }

  return copied
}

/**
 * Devuelve la lista de targets soportados.
 * @returns {{name: string, file: string}[]}
 */
export function getTargets() {
  return TARGETS
}
