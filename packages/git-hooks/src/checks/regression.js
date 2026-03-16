import { logger } from '../utils/logger.js'
import { getFileHistory, parseDiff } from '../utils/git.js'
import { REGRESSION_EXTENSIONS, EXCLUDED_PATHS } from '../config/patterns.js'
import { extname } from 'node:path'

/**
 * Normaliza una línea para comparación.
 * CSS: case-insensitive. JS: case-sensitive. Ambos: trim + colapsar whitespace.
 * @param {string} line
 * @param {string} file
 * @returns {string}
 */
function normalizeLine(line, file) {
  let normalized = line.trim().replace(/\s+/g, ' ')
  const ext = extname(file)
  if (['.css', '.scss', '.less'].includes(ext)) {
    normalized = normalized.toLowerCase()
  }
  return normalized
}

/**
 * Parsea patches del historial git y construye un mapa de líneas eliminadas.
 * @param {string} historyOutput
 * @param {string} file
 * @returns {Map<string, {commit: string, date: string, message: string}>}
 */
function buildHistoryMap(historyOutput, file) {
  const map = new Map()
  if (!historyOutput) return map

  let currentCommit = null
  let currentDate = null
  let currentMessage = null

  for (const line of historyOutput.split('\n')) {
    const commitMatch = line.match(/^commit ([a-f0-9]+)/)
    if (commitMatch) {
      currentCommit = commitMatch[1].slice(0, 7)
      continue
    }

    const dateMatch = line.match(/^Date:\s+(.+)/)
    if (dateMatch) {
      currentDate = dateMatch[1].trim()
      continue
    }

    // Primera línea no vacía después del header es el mensaje
    if (currentCommit && currentDate && !currentMessage && line.trim() && !line.startsWith('diff') && !line.startsWith('---') && !line.startsWith('+++') && !line.startsWith('@@') && !line.startsWith('Author:')) {
      currentMessage = line.trim()
      continue
    }

    // Líneas añadidas en el historial = estados anteriores del código
    if (line.startsWith('+') && !line.startsWith('+++') && currentCommit) {
      const content = line.slice(1)
      const normalized = normalizeLine(content, file)
      if (normalized && normalized.length > 3) {
        // Solo guardar la primera aparición (commit más reciente primero en git log)
        if (!map.has(normalized)) {
          map.set(normalized, {
            commit: currentCommit,
            date: currentDate ?? '',
            message: currentMessage ?? '',
          })
        }
      }
    }

    // Reset en nuevo commit
    if (line.startsWith('commit ') && line.length > 7) {
      currentMessage = null
    }
  }

  return map
}

/**
 * Check 2: Detecta posibles regresiones comparando cambios staged con historial.
 * Solo WARNING, no bloquea el commit.
 *
 * @param {string} diffOutput - Output de git diff --cached -U0
 * @param {object} config
 * @param {number} [config.historyDepth=10]
 * @param {number} [config.maxFiles=20]
 * @returns {Promise<{warnings: Array<{file: string, actual: string, staged: string, commit: string, date: string, message: string}>}>}
 */
export async function runRegressionCheck(diffOutput, { historyDepth = 10, maxFiles = 20 } = {}) {
  const warnings = []
  const parsed = parseDiff(diffOutput)

  // Filtrar archivos relevantes
  const relevantFiles = parsed.filter((f) => {
    const ext = extname(f.file)
    if (!REGRESSION_EXTENSIONS.includes(ext)) return false
    if (EXCLUDED_PATHS.some((ex) => f.file.includes(ex))) return false
    // Solo hunks que tienen AMBAS removes + adds (cambios, no adds/deletes puros)
    return f.hunks.some((h) => h.added.length > 0 && h.removed.length > 0)
  })

  if (relevantFiles.length === 0) return { warnings }

  if (relevantFiles.length > maxFiles) {
    logger.info(`Regresiones: ${relevantFiles.length} archivos modificados (> ${maxFiles}), omitiendo check`)
    return { warnings }
  }

  // Obtener historial de cada archivo en paralelo
  const historyResults = await Promise.all(
    relevantFiles.map(async (f) => ({
      file: f.file,
      hunks: f.hunks,
      history: getFileHistory(f.file, historyDepth),
    }))
  )

  for (const { file, hunks, history } of historyResults) {
    const historyMap = buildHistoryMap(history, file)
    if (historyMap.size === 0) continue

    for (const hunk of hunks) {
      // Solo analizar hunks con cambios (no adds/deletes puros)
      if (hunk.added.length === 0 || hunk.removed.length === 0) continue

      for (const removedLine of hunk.removed) {
        const normalizedRemoved = normalizeLine(removedLine, file)
        if (!normalizedRemoved || normalizedRemoved.length <= 3) continue

        // Buscar si la línea eliminada fue añadida en un commit anterior
        const historyEntry = historyMap.get(normalizedRemoved)
        if (historyEntry) {
          // Comprobar si alguna línea añadida está reemplazando esta
          for (const addedLine of hunk.added) {
            const normalizedAdded = normalizeLine(addedLine, file)
            if (normalizedAdded !== normalizedRemoved) {
              warnings.push({
                file,
                actual: removedLine.trim(),
                staged: addedLine.trim(),
                commit: historyEntry.commit,
                date: historyEntry.date,
                message: historyEntry.message,
              })
              break // Una warning por línea eliminada es suficiente
            }
          }
        }
      }
    }
  }

  if (warnings.length > 0) {
    logger.blank()
    logger.warn('WARNING: Posibles regresiones detectadas (no bloqueante)')
    logger.blank()
    for (const w of warnings) {
      logger.dim(`${w.file}`)
      logger.detail('Actual', w.actual)
      logger.detail('Staged', w.staged)
      logger.detail('Commit', `${w.commit} (${w.date}): "${w.message}"`)
      logger.blank()
    }
    console.log('  Verifica que estos cambios son intencionales.\n')
  } else {
    logger.success('Regresiones: sin cambios sospechosos detectados')
  }

  return { warnings }
}
