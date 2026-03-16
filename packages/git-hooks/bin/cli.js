#!/usr/bin/env node

/**
 * CLI: npx @geniova/git-hooks <command>
 *
 * Comandos:
 *   init      — Configura husky + hooks + guidelines para todos los agentes IA
 *   generate  — Regenera guidelines para todos los agentes IA
 *   run       — Ejecuta checks manualmente (--check=lint|regression|ai-refs)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { generateAllTargets } from '../src/generators/guidelines.js'

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const GREEN = '\x1b[32m'
const CYAN = '\x1b[36m'
const RED = '\x1b[31m'

function log(msg) { console.log(msg) }
function success(msg) { log(`${GREEN}✓${RESET} ${msg}`) }
function error(msg) { console.error(`${RED}✖${RESET} ${msg}`) }
function info(msg) { log(`${CYAN}ℹ${RESET} ${msg}`) }

const command = process.argv[2]

if (!command || command === '--help' || command === '-h') {
  log(`
${BOLD}@geniova/git-hooks${RESET}

Uso:
  npx @geniova/git-hooks init          Configura hooks + guidelines para todos los agentes
  npx @geniova/git-hooks generate      Regenera guidelines para todos los agentes
  npx @geniova/git-hooks run           Ejecuta todos los checks
  npx @geniova/git-hooks run --check=<name>  Ejecuta un check específico
                                        (lint, regression, ai-refs)
`)
  process.exit(0)
}

if (command === 'init') {
  init()
} else if (command === 'generate') {
  generate()
} else if (command === 'run') {
  run()
} else {
  error(`Comando desconocido: ${command}`)
  process.exit(1)
}

function init() {
  const cwd = process.cwd()

  // Verificar que estamos en un proyecto con package.json y .git
  if (!existsSync(join(cwd, 'package.json'))) {
    error('No se encontró package.json en el directorio actual')
    process.exit(1)
  }
  if (!existsSync(join(cwd, '.git'))) {
    error('No se encontró directorio .git — ¿estás en la raíz del proyecto?')
    process.exit(1)
  }

  info('Configurando @geniova/git-hooks...')

  // 1. Inicializar husky
  try {
    execSync('npx husky init', { cwd, stdio: 'pipe' })
    success('Husky inicializado')
  } catch {
    // Puede fallar si ya está inicializado
    info('Husky ya inicializado o no disponible, continuando...')
  }

  // 2. Crear .husky/pre-commit
  const huskyDir = join(cwd, '.husky')
  if (!existsSync(huskyDir)) {
    mkdirSync(huskyDir, { recursive: true })
  }

  const preCommitScript = `node node_modules/@geniova/git-hooks/src/hooks/pre-commit.js\n`
  writeFileSync(join(huskyDir, 'pre-commit'), preCommitScript, { mode: 0o755 })
  success('Hook pre-commit creado en .husky/pre-commit')

  // 2b. Crear .husky/commit-msg
  const commitMsgScript = `node node_modules/@geniova/git-hooks/src/hooks/commit-msg.js "$1"\n`
  writeFileSync(join(huskyDir, 'commit-msg'), commitMsgScript, { mode: 0o755 })
  success('Hook commit-msg creado en .husky/commit-msg')

  // 2c. Crear .husky/pre-push
  const prePushScript = `node node_modules/@geniova/git-hooks/src/hooks/pre-push.js\n`
  writeFileSync(join(huskyDir, 'pre-push'), prePushScript, { mode: 0o755 })
  success('Hook pre-push creado en .husky/pre-push')

  // 3. Añadir prepare script al package.json
  const pkgPath = join(cwd, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  if (!pkg.scripts) pkg.scripts = {}
  if (!pkg.scripts.prepare) {
    pkg.scripts.prepare = 'husky'
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    success('Script "prepare": "husky" añadido a package.json')
  } else if (!pkg.scripts.prepare.includes('husky')) {
    info(`Ya existe script "prepare": "${pkg.scripts.prepare}" — añade "husky" manualmente si es necesario`)
  } else {
    info('Script "prepare" ya incluye husky')
  }

  // 4. Instalar GitHub Action para bloquear atribución a IA
  installGitHubAction(cwd)

  // 5. Generar guidelines para todos los agentes
  generateGuidelines(cwd)

  // 6. Detectar monorepo
  if (pkg.workspaces) {
    info('Monorepo detectado (workspaces). El hook se ejecuta desde la raíz del repo.')
  }

  log('')
  success('¡Configuración completada!')
  info('Los hooks pre-commit, commit-msg y pre-push se ejecutarán automáticamente.')
  info('Configura opciones en .githooksrc.json (opcional)')
  info('Edita los ficheros de guidelines para añadir instrucciones específicas del proyecto')
}

function installGitHubAction(cwd) {
  const workflowsDir = join(cwd, '.github', 'workflows')
  const destPath = join(workflowsDir, 'no-ai-refs.yml')
  const srcPath = join(import.meta.dirname, '..', 'github-actions', 'no-ai-refs.yml')

  if (existsSync(destPath)) {
    info('GitHub Action no-ai-refs.yml ya existe')
    return
  }

  mkdirSync(workflowsDir, { recursive: true })
  copyFileSync(srcPath, destPath)
  success('GitHub Action no-ai-refs.yml instalada en .github/workflows/')
}

function generate() {
  const cwd = process.cwd()
  generateGuidelines(cwd)
  log('')
  success('Guidelines actualizadas para todos los agentes')
}

function generateGuidelines(cwd) {
  const results = generateAllTargets(cwd)
  for (const r of results) {
    if (r.created) {
      success(`${r.file} generado (${r.target})`)
    } else {
      success(`${r.file} actualizado (${r.target})`)
    }
  }
}

async function run() {
  // Delega al orquestador con los args restantes
  const args = process.argv.slice(3).join(' ')
  const checkArg = process.argv.find((a) => a.startsWith('--check='))

  if (checkArg) {
    // Ejecutar check específico vía CI runner
    const { execSync: exec } = await import('node:child_process')
    try {
      exec(`node ${resolve(import.meta.dirname, '..', 'src', 'ci', 'run-checks.js')} ${args}`, {
        stdio: 'inherit',
      })
    } catch {
      process.exit(1)
    }
  } else {
    // Ejecutar pre-commit completo
    const { execSync: exec } = await import('node:child_process')
    try {
      exec(`node ${resolve(import.meta.dirname, '..', 'src', 'hooks', 'pre-commit.js')}`, {
        stdio: 'inherit',
      })
    } catch {
      process.exit(1)
    }
  }
}
