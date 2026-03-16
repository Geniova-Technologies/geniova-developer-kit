import { logger } from '../utils/logger.js'
import { parseDiff } from '../utils/git.js'
import { AI_PATTERNS, AI_REFS_EXCLUDED_FILES } from '../config/patterns.js'

/**
 * Comprueba si un archivo debe excluirse del check de referencias a IA.
 * @param {string} filePath
 * @param {string[]} excludedFiles
 * @returns {boolean}
 */
function isExcluded(filePath, excludedFiles) {
  return excludedFiles.some((pattern) => {
    if (pattern.endsWith('/')) {
      return filePath.startsWith(pattern) || filePath.includes(`/${pattern}`)
    }
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      return filePath.startsWith(prefix) || filePath.includes(`/${prefix}`)
    }
    return filePath === pattern || filePath.endsWith(`/${pattern}`)
  })
}

/**
 * Check 3: Bloquea commits que contienen referencias a IA en líneas añadidas.
 *
 * @param {string} diffOutput - Output de git diff --cached -U0
 * @param {object} [options]
 * @param {RegExp[]} [options.extraPatterns] - Patrones adicionales a buscar
 * @param {string[]} [options.allowInFiles] - Archivos adicionales a excluir
 * @returns {{passed: boolean, matches: Array<{file: string, line: string, pattern: string}>}}
 */
export function runNoAiRefsCheck(diffOutput, { extraPatterns = [], allowInFiles = [] } = {}) {
  const matches = []
  const parsed = parseDiff(diffOutput)

  const allPatterns = [...AI_PATTERNS, ...extraPatterns]
  const allExcluded = [...AI_REFS_EXCLUDED_FILES, ...allowInFiles]

  for (const fileEntry of parsed) {
    if (isExcluded(fileEntry.file, allExcluded)) continue

    for (const hunk of fileEntry.hunks) {
      for (const addedLine of hunk.added) {
        for (const pattern of allPatterns) {
          if (pattern.test(addedLine)) {
            matches.push({
              file: fileEntry.file,
              line: addedLine.trim(),
              pattern: pattern.source,
            })
            // Reset lastIndex para RegExp con flag /g
            pattern.lastIndex = 0
            break // Un match por línea es suficiente
          }
          // Reset lastIndex
          pattern.lastIndex = 0
        }
      }
    }
  }

  if (matches.length > 0) {
    logger.blank()
    logger.error('Referencias a IA detectadas en el commit:')
    logger.blank()
    for (const m of matches) {
      logger.dim(`${m.file}`)
      logger.detail('Línea', m.line)
      logger.detail('Patrón', m.pattern)
      logger.blank()
    }
    logger.error('Elimina las referencias a IA antes de commitear.')
  } else {
    logger.success('AI refs: sin referencias a IA detectadas')
  }

  return { passed: matches.length === 0, matches }
}
