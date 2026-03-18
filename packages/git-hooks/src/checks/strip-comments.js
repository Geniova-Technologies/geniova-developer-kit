import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { logger } from '../utils/logger.js'
import { EXCLUDED_PATHS } from '../config/patterns.js'

const STRIPPABLE_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.jsx', '.tsx', '.astro']

const KEEP_PATTERNS = [
  /@param|@returns|@type|@typedef|@property|@enum/,
  /TODO|FIXME|HACK|WARN|NOTE|XXX/,
  /eslint|prettier|ts-ignore|@ts-|noqa/,
  /https?:\/\//,
]

/**
 * Checks if a line is a standalone // comment that should be stripped.
 * @param {string} line
 * @returns {boolean}
 */
function isStrippableComment(line) {
  const trimmed = line.trimStart()

  if (!trimmed.startsWith('//')) return false

  // Inside JSDoc block — lines starting with * are kept by not matching here
  // (they don't start with //)

  const commentBody = trimmed.slice(2)

  for (const pattern of KEEP_PATTERNS) {
    if (pattern.test(commentBody)) return false
  }

  return true
}

/**
 * Strips useless single-line // comments from staged JS/TS/Astro files.
 * Preserves JSDoc, TODO/FIXME/HACK/WARN/NOTE/XXX, directives, and URLs.
 * Re-stages modified files.
 *
 * @param {string[]} stagedFiles
 * @returns {{strippedFiles: string[], totalRemoved: number}}
 */
export function runStripComments(stagedFiles) {
  const candidates = stagedFiles.filter((f) => {
    if (EXCLUDED_PATHS.some((exc) => f.startsWith(exc) || f.includes(`/${exc}`))) return false
    return STRIPPABLE_EXTENSIONS.some((ext) => f.endsWith(ext))
  })

  if (candidates.length === 0) {
    logger.info('Strip comments: sin archivos JS/TS/Astro staged')
    return { strippedFiles: [], totalRemoved: 0 }
  }

  const strippedFiles = []
  let totalRemoved = 0

  for (const file of candidates) {
    let content
    try {
      content = readFileSync(file, 'utf-8')
    } catch {
      continue
    }

    const lines = content.split('\n')
    const filtered = []
    let insideJSDoc = false
    let removed = 0

    for (const line of lines) {
      const trimmed = line.trimStart()

      if (trimmed.startsWith('/**')) insideJSDoc = true
      if (insideJSDoc) {
        filtered.push(line)
        if (trimmed.includes('*/')) insideJSDoc = false
        continue
      }

      if (isStrippableComment(line)) {
        removed++
      } else {
        filtered.push(line)
      }
    }

    if (removed > 0) {
      writeFileSync(file, filtered.join('\n'))
      execSync(`git add "${file}"`)
      strippedFiles.push(file)
      totalRemoved += removed
      logger.dim(`  ${file}: ${removed} comentario(s) eliminado(s)`)
    }
  }

  if (totalRemoved > 0) {
    logger.success(`Strip comments: ${totalRemoved} comentario(s) eliminado(s) de ${strippedFiles.length} archivo(s)`)
  } else {
    logger.success('Strip comments: sin comentarios descriptivos que eliminar')
  }

  return { strippedFiles, totalRemoved }
}
