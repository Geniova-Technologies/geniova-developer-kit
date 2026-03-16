import { execSync } from 'node:child_process'

/**
 * Ejecuta un comando git y devuelve stdout como string.
 * @param {string} args
 * @returns {string}
 */
function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }).trim()
}

/**
 * Obtiene la lista de archivos staged (Added, Copied, Modified, Renamed).
 * @returns {string[]}
 */
export function getStagedFiles() {
  const output = git('diff --cached --name-only --diff-filter=ACMR')
  if (!output) return []
  return output.split('\n').filter(Boolean)
}

/**
 * Obtiene el diff de archivos staged con 0 líneas de contexto.
 * @returns {string}
 */
export function getStagedDiff() {
  return git('diff --cached -U0')
}

/**
 * Obtiene el historial de patches de un archivo (últimos N commits).
 * @param {string} filePath
 * @param {number} depth - Número de commits a revisar
 * @returns {string}
 */
export function getFileHistory(filePath, depth = 10) {
  try {
    return git(`log -n ${depth} --follow -p -- "${filePath}"`)
  } catch {
    return ''
  }
}

/**
 * Obtiene el diff entre dos refs (para CI con PRs).
 * @param {string} base
 * @param {string} head
 * @returns {string}
 */
export function getDiffBetween(base, head) {
  return git(`diff ${base}...${head} -U0`)
}

/**
 * Obtiene los archivos cambiados entre dos refs.
 * @param {string} base
 * @param {string} head
 * @returns {string[]}
 */
export function getChangedFilesBetween(base, head) {
  const output = git(`diff ${base}...${head} --name-only --diff-filter=ACMR`)
  if (!output) return []
  return output.split('\n').filter(Boolean)
}

/**
 * Parsea un diff unificado en hunks por archivo.
 * @param {string} diffOutput
 * @returns {Array<{file: string, hunks: Array<{added: string[], removed: string[]}>}>}
 */
export function parseDiff(diffOutput) {
  if (!diffOutput) return []

  const files = []
  let currentFile = null
  let currentHunk = null

  for (const line of diffOutput.split('\n')) {
    if (line.startsWith('diff --git')) {
      if (currentFile && currentHunk) {
        currentFile.hunks.push(currentHunk)
      }
      const match = line.match(/b\/(.+)$/)
      currentFile = { file: match?.[1] ?? '', hunks: [] }
      files.push(currentFile)
      currentHunk = null
      continue
    }

    if (line.startsWith('@@')) {
      if (currentFile && currentHunk) {
        currentFile.hunks.push(currentHunk)
      }
      currentHunk = { added: [], removed: [] }
      continue
    }

    if (!currentHunk) continue

    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentHunk.added.push(line.slice(1))
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      currentHunk.removed.push(line.slice(1))
    }
  }

  if (currentFile && currentHunk) {
    currentFile.hunks.push(currentHunk)
  }

  return files
}
