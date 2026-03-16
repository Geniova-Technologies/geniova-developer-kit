import { logger } from '../utils/logger.js'
import { AI_PATTERNS } from '../config/patterns.js'

/**
 * Patrones adicionales específicos para mensajes de commit.
 * Complementan los de AI_PATTERNS con frases típicas de co-autoría.
 */
const COMMIT_MSG_PATTERNS = [
  /\bBard\b/i,
  /\bai[- ]?assisted\b/i,
  /\bai[- ]?written\b/i,
  /\bmade by ai\b/i,
  /\bcreated by ai\b/i,
]

/**
 * Check: Bloquea commits cuyo mensaje contiene referencias a IA.
 *
 * @param {string} commitMessage - Contenido del mensaje de commit
 * @param {object} [options]
 * @param {RegExp[]} [options.extraPatterns] - Patrones adicionales a buscar
 * @returns {{passed: boolean, matches: Array<{line: string, pattern: string}>}}
 */
export function runCommitMsgNoAiCheck(commitMessage, { extraPatterns = [] } = {}) {
  const matches = []
  const allPatterns = [...AI_PATTERNS, ...COMMIT_MSG_PATTERNS, ...extraPatterns]

  for (const line of commitMessage.split('\n')) {
    for (const pattern of allPatterns) {
      if (pattern.test(line)) {
        matches.push({
          line: line.trim(),
          pattern: pattern.source,
        })
        pattern.lastIndex = 0
        break
      }
      pattern.lastIndex = 0
    }
  }

  if (matches.length > 0) {
    logger.blank()
    logger.error('El mensaje del commit contiene referencias a IA:')
    logger.blank()
    for (const m of matches) {
      logger.detail('Línea', m.line)
      logger.detail('Patrón', m.pattern)
      logger.blank()
    }
    logger.error('Elimina las referencias a IA del mensaje de commit.')
  } else {
    logger.success('Commit message: sin referencias a IA')
  }

  return { passed: matches.length === 0, matches }
}
